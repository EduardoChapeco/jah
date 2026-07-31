import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listTeamMembersHandler,
  updateTeamMemberRoleHandler,
  inviteTeamMemberHandler,
} from "./admin-team.functions";
import { getServerIdentity } from "@/lib/server-access";
import { getServerClient } from "@/lib/supabase";

function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    upsert: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    in: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => builder),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolvedValue)),
    limit: vi.fn().mockImplementation(() => builder),
    then: vi.fn().mockImplementation((onfulfilled: any) => {
      return Promise.resolve(resolvedValue).then(onfulfilled);
    }),
  };
  return builder;
}

const mockFrom = vi.fn();
const mockSchema = vi.fn().mockReturnValue({ from: mockFrom });
const mockCreateUser = vi.fn();

const mockSupabase = { 
  from: mockFrom,
  schema: mockSchema,
  auth: { admin: { createUser: mockCreateUser } },
};

vi.mock("@/lib/server-access", () => ({
  getServerIdentity: vi.fn(),
  assertStoreAccess: vi.fn().mockImplementation((identity: any, allowedRoles: string[]) => {
    if (!identity.id || !identity.store_id || !allowedRoles.includes(identity.role)) {
      throw new Error("Não autorizado");
    }
  }),
}));

vi.mock("@/lib/supabase", () => ({
  getServerClient: vi.fn(() => mockSupabase),
  SupabaseUnconfiguredError: class extends Error {},
}));

describe("Admin Team Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTeamMembersHandler", () => {
    it("should throw if user is not authorized", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "seller",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      await expect(listTeamMembersHandler()).rejects.toThrow("Não autorizado");
    });

    it("should return team members when authorized", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockDbResponse = [
        {
          profile_id: "user-123",
          role: "owner",
          created_at: "2023-01-01T00:00:00Z",
          profiles: { id: "user-123", full_name: "Owner", avatar_url: "http://avatar.com/1" }
        },
      ];
      
      const mockAuthUsers = [{ id: "user-123", email: "owner@example.com" }];
      
      mockFrom.mockImplementation((table: string) => {
        if (table === "workspace_members") return createMockQueryBuilder({ data: mockDbResponse, error: null });
        if (table === "users") return createMockQueryBuilder({ data: mockAuthUsers, error: null });
        return createMockQueryBuilder({ data: [], error: null });
      });

      const expectedData = [
        {
          id: "user-123",
          role: "owner",
          created_at: "2023-01-01T00:00:00Z",
          full_name: "Owner",
          avatar_url: "http://avatar.com/1",
          email: "owner@example.com",
        },
      ];

      const res = await listTeamMembersHandler();
      expect(res).toEqual(expectedData);
      expect(mockFrom).toHaveBeenCalledWith("workspace_members");
    });

    it("should throw database error if retrieval fails", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      mockFrom.mockImplementation(() => createMockQueryBuilder({ data: null, error: new Error("Database error") }));

      await expect(listTeamMembersHandler()).rejects.toThrow("Database error");
    });
  });

  describe("updateTeamMemberRoleHandler", () => {
    it("should throw if operator is not admin or owner", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "manager",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      await expect(
        updateTeamMemberRoleHandler({ id: "other-user", role: "seller" }),
      ).rejects.toThrow("Não autorizado");
    });

    it("should prevent owner from demoting themselves", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);
      await expect(
        updateTeamMemberRoleHandler({ id: "user-123", role: "manager" }),
      ).rejects.toThrow("O dono da loja não pode rebaixar a si mesmo.");
    });

    it("should prevent non-owner from promoting someone to owner", async () => {
      const mockIdentity = { id: "user-456", store_id: "store-456", role: "admin", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);
      
      const builder = createMockQueryBuilder({ data: { role: "manager" }, error: null });
      mockFrom.mockImplementation(() => builder);

      await expect(
        updateTeamMemberRoleHandler({ id: "user-123", role: "owner" }),
      ).rejects.toThrow("Apenas o proprietário pode transferir a propriedade da loja.");
    });

    it("should throw error if member not found", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);
      
      const builder = createMockQueryBuilder({ data: null, error: new Error("Not found") });
      mockFrom.mockImplementation(() => builder);

      await expect(
        updateTeamMemberRoleHandler({ id: "user-999", role: "manager" }),
      ).rejects.toThrow("Membro da equipe não encontrado ou pertence a outra loja.");
    });

    it("should prevent editing owner if you are not owner", async () => {
      const mockIdentity = { id: "user-456", store_id: "store-456", role: "admin", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);
      
      const builder = createMockQueryBuilder({ data: { role: "owner" }, error: null });
      mockFrom.mockImplementation(() => builder);

      await expect(
        updateTeamMemberRoleHandler({ id: "user-123", role: "manager" }),
      ).rejects.toThrow("Apenas o proprietário pode alterar suas próprias permissões.");
    });

    it("should successfully update team member role", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      const mockUpdated = { profile_id: "user-456", role: "manager" };
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return createMockQueryBuilder({ data: { role: "seller" }, error: null });
        return createMockQueryBuilder({ data: mockUpdated, error: null });
      });

      const res = await updateTeamMemberRoleHandler({ id: "user-456", role: "manager" });

      expect(res).toEqual(mockUpdated);
      expect(mockFrom).toHaveBeenCalledWith("workspace_members");
    });
  });

  describe("inviteTeamMemberHandler", () => {
    it("should throw if user is not admin, manager, or owner", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "seller",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Não autorizado");
    });

    it("should prevent manager from inviting admins", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "manager",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Admin",
          role: "admin",
        }),
      ).rejects.toThrow("Gerentes não podem convidar membros com cargo de Administrador.");
    });

    it("should throw if auth creation fails", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      mockCreateUser.mockResolvedValueOnce({ data: null, error: { message: "Auth failed" } });

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Erro ao criar conta Auth: Auth failed");
    });

    it("should throw if profile promotion fails", async () => {
      vi.mocked(getServerIdentity).mockResolvedValueOnce({
        id: "user-123",
        role: "admin",
        store_id: "store-456",
        memberships: [{ store_id: "store-123", role: "admin" }],
      });

      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: "new-user-123" } }, error: null });
      mockFrom.mockImplementation(() => createMockQueryBuilder({ error: { message: "Profile upsert failed" } }));

      await expect(
        inviteTeamMemberHandler({
          email: "test@loja.com",
          fullName: "Test Seller",
          role: "seller",
        }),
      ).rejects.toThrow("Erro ao promover usuário a membro da equipe.");
    });

    it("should successfully invite team member and promote profile via upsert", async () => {
      const mockIdentity = { id: "user-123", store_id: "store-456", role: "owner", memberships: [] };
      vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);

      mockCreateUser.mockResolvedValueOnce({
        data: { user: { id: "new-user-123" } },
        error: null,
      });

      const builder = createMockQueryBuilder({ error: null });
      mockFrom.mockImplementation(() => builder);

      const res = await inviteTeamMemberHandler({
        email: "seller@test.com",
        fullName: "Test Seller",
        role: "seller",
      });

      expect(res).toEqual({ status: "success" });
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "seller@test.com",
        }),
      );
      expect(mockFrom).toHaveBeenCalledWith("workspace_members");
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(builder.upsert).toHaveBeenCalledWith({
        profile_id: "new-user-123",
        role: "seller",
        store_id: "store-456",
      });
      expect(builder.upsert).toHaveBeenCalledWith({
        id: "new-user-123",
        full_name: "Test Seller",
      });
    });
  });
});

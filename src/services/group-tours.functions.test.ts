import { describe, it, expect } from "vitest";
import { generateDefaultBusSeats } from "./group-tours.functions";

describe("Group Tours Contract & Engine Shield (Microfase 75B)", () => {
  it("gera mapa padrão de 46 assentos com corredores e numeração correta", () => {
    const seats = generateDefaultBusSeats(46);
    expect(seats).toHaveLength(46);

    // Primeiro assento é 1, janela esquerda (A) piso 1
    expect(seats[0]).toMatchObject({
      seat_number: 1,
      row: 1,
      column: "A",
      floor: 1,
      status: "free",
      passenger_name: null,
    });

    // Último assento é 46
    expect(seats[45]).toMatchObject({
      seat_number: 46,
      floor: 1,
      status: "free",
      passenger_name: null,
    });
  });

  it("garante que todos os assentos comecem livres e sem dados pessoais", () => {
    const seats = generateDefaultBusSeats(40);
    expect(seats).toHaveLength(40);
    expect(seats.every((s) => s.passenger_name === null)).toBe(true);
    expect(seats.every((s) => s.passenger_document === null)).toBe(true);
    expect(seats.every((s) => s.passenger_phone === null)).toBe(true);
    expect(seats.every((s) => s.boarding_point === null)).toBe(true);
    expect(seats.every((s) => s.status === "free")).toBe(true);
  });
});

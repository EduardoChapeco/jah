import { z } from "zod";

export type ExperienceType = "storefront" | "biolink" | "pwa" | "campaign" | "seller_showcase";

export interface ExperienceDocument {
  id: string;
  store_id: string;
  document_type: ExperienceType;
  owner_id?: string | null;
  slug: string;
  title: string;
  seo_metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type NodeType = "section" | "container" | "element" | "composition";

export type BlockType =
  | "section"
  | "container"
  | "rich_text"
  | "hero_carousel"
  | "bento_grid"
  | "countdown_timer"
  | "stories_ring"
  | "trust_badges"
  | "product_rail"
  | "announcement_bar"
  | "video_section"
  | "contact_form"
  | "booking_calendar"
  | "gallery_grid"
  | "info_cards"
  | "mosaic_banners"
  | "social_grid"
  | "faq_accordion"
  | "testimonial_carousel"
  | "timeline_history"
  | "product_carousel"
  | "product_grid"
  | "split_banner"
  | "store_profile_hero"
  | "store_hours"
  | "store_contact"
  | "image_hotspots"
  | "routine_steps"
  | "ingredient_spotlight"
  | "before_after_slider"
  | "event_rail"
  | "community_feed";
export interface ResponsiveValue<T> {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}

export interface DataBinding {
  source?: string;
  limit?: number;
  collection_slug?: string;
  [key: string]: any;
}

export const DataBindingSchema = z
  .object({
    source: z.string().optional(),
    limit: z.number().optional(),
    collection_slug: z.string().optional(),
  })
  .catchall(z.unknown());

export const ExperienceNodeSchema = z.object({
  id: z.string().uuid().or(z.string()), // Accept both for now as some UI generators use non-uuids initially
  version_id: z.string().uuid().optional(),
  parent_id: z.string().nullable().optional(),
  node_type: z.enum(["section", "container", "element", "composition"]),
  block_type: z.string(),
  layout_variant: z.string().nullable().optional(),
  content: z.record(z.unknown()).default({}),
  design_tokens: z.record(z.unknown()).default({}),
  layout_rules: z.record(z.unknown()).default({}),
  responsive_overrides: z.record(z.unknown()).default({}),
  data_bindings: DataBindingSchema.default({}),
  action_bindings: z.record(z.unknown()).default({}),
  sort_order: z.number().default(0),
  is_hidden: z.boolean().default(false),
  children: z.array(z.unknown()).optional(),
});

export interface ExperienceNode {
  id: string;
  version_id: string;
  parent_id?: string | null;

  node_type: NodeType;
  block_type: BlockType;
  layout_variant?: string | null;

  content: Record<string, any>;
  design_tokens: Record<string, any>;
  layout_rules: Record<string, any>;
  responsive_overrides: Record<string, ResponsiveValue<any>>;
  data_bindings: DataBinding;
  action_bindings: Record<string, any>;

  sort_order: number;
  is_hidden: boolean;

  // Children (hydrated in the tree representation, not persisted in flat rows)
  children?: ExperienceNode[];
}

// ---------------------------------------------------------------------------
// Block Registry Definitions
// ---------------------------------------------------------------------------

export type InspectorFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "color"
  | "collection_select"
  | "category_select"
  | "image"
  | "video"
  | "select"
  | "radio"
  | "slider"
  | "data_binding"
  | "action_selector"
  | "collection"
  | "product"
  | "json"
  | "array";

export interface InspectorField {
  name: string;
  label: string;
  type: InspectorFieldType;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  helpText?: string;
  required?: boolean;
  arrayFields?: InspectorField[];
}

export type BlockCategory =
  "layout" | "content" | "media" | "commerce" | "social" | "forms" | "marketing";

export interface BlockManifest {
  type: BlockType;
  version: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string;

  allowedBuilderProfiles: ExperienceType[] | "all";
  allowedParentTypes: NodeType[] | "none" | "all";
  allowedChildTypes: NodeType[] | "none" | "all";

  // Schemas for server-side validation
  contentSchema: z.ZodTypeAny;
  styleSchema?: z.ZodTypeAny;
  layoutSchema?: z.ZodTypeAny;

  layoutVariants?: { label: string; value: string }[];

  // Inspector definition (UI for the editor)
  inspector: {
    content?: InspectorField[];
    design?: InspectorField[];
    layout?: InspectorField[];
  };

  defaultProps: Partial<ExperienceNode>;
  previewImageUrl?: string; // Used in Guided Mode
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  previewImageUrl: string; // The thumbnail to show in the Section Picker
  defaultSource?: string; // Optional default data binding source (e.g. 'latest_products')
  /**
   * The template structure.
   * When injected, these are cloned and assigned new UUIDs, maintaining parent/child relationships based on array order or placeholder IDs.
   * For simplicity in this micro-phase, we define a structured tree that will be flattened at injection.
   */
  nodes: Partial<ExperienceNode>[];
}

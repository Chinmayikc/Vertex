import type { Database, Json } from "@/integrations/supabase/types";
export type FinalistSettings = {
  event_id: string;
  dashboard_enabled: boolean;
  submissions_enabled: boolean;
  opens_at: string | null;
  closes_at: string | null;
  organizer_contact: string;
};
export type FinalistUpload = {
  id: string;
  event_id: string;
  team_id: string;
  user_id: string;
  object_key: string;
  file_name: string;
  file_size: number;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  deleted_at: string | null;
};
export type FinalProject = {
  event_id: string;
  team_id: string;
  upload_id: string;
  project_url: string;
  demo_url: string;
  github_url: string;
  video_url: string;
  deck_key: string;
  deck_name: string;
  deck_size: number;
  created_at: string;
  submitted_at: string;
};
type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
// Additive local schema extension. Retain existing generated types unchanged.
export type FinalistDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Omit<Database["public"]["Tables"], "event_registrations"> & {
      event_registrations: Table<
        Database["public"]["Tables"]["event_registrations"]["Row"] & {
          status: string;
          form_data: Json;
        }
      >;
      finalist_settings: Table<FinalistSettings>;
      event_finalists: Table<{ event_id: string; team_id: string; confirmed_at: string }>;
      finalist_uploads: Table<FinalistUpload>;
      final_project_submissions: Table<FinalProject>;
    };
    Functions: Database["public"]["Functions"] & {
      reserve_finalist_upload: {
        Args: {
          p_event: string;
          p_team: string;
          p_user: string;
          p_name: string;
          p_size: number;
          p_id: string;
        };
        Returns: FinalistUpload[];
      };
      commit_finalist_submission: {
        Args: { p_event: string; p_team: string; p_user: string; p_upload: string; p_links: Json };
        Returns: FinalProject[];
      };
    };
  };
};

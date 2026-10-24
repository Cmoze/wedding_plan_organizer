export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      activity: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          summary: string;
          wedding_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          summary?: string;
          wedding_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          summary?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_items: {
        Row: {
          actual: number | null;
          category: string;
          created_at: string;
          description: string;
          due_date: string | null;
          estimated: number;
          id: string;
          paid: number;
          task_id: string | null;
          updated_at: string;
          vendor_id: string | null;
          wedding_id: string;
        };
        Insert: {
          actual?: number | null;
          category: string;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          estimated?: number;
          id?: string;
          paid?: number;
          task_id?: string | null;
          updated_at?: string;
          vendor_id?: string | null;
          wedding_id: string;
        };
        Update: {
          actual?: number | null;
          category?: string;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          estimated?: number;
          id?: string;
          paid?: number;
          task_id?: string | null;
          updated_at?: string;
          vendor_id?: string | null;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_items_task_id_wedding_id_fkey";
            columns: ["task_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "budget_items_vendor_id_wedding_id_fkey";
            columns: ["vendor_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "budget_items_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_templates: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          months_before: number;
          notes: string | null;
          sort_order: number;
          title: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          months_before: number;
          notes?: string | null;
          sort_order?: number;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          months_before?: number;
          notes?: string | null;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          idea_item_id: string | null;
          task_id: string | null;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          idea_item_id?: string | null;
          task_id?: string | null;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          idea_item_id?: string | null;
          task_id?: string | null;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_idea_item_id_wedding_id_fkey";
            columns: ["idea_item_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "idea_items";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "comments_task_id_wedding_id_fkey";
            columns: ["task_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "comments_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      emails: {
        Row: {
          attachments: Json;
          body_html: string | null;
          body_text: string | null;
          created_at: string;
          from_address: string;
          from_name: string | null;
          id: string;
          is_read: boolean;
          linked_budget_item_id: string | null;
          linked_task_id: string | null;
          linked_vendor_id: string | null;
          provider_message_id: string | null;
          received_at: string;
          subject: string;
          to_address: string;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          attachments?: Json;
          body_html?: string | null;
          body_text?: string | null;
          created_at?: string;
          from_address: string;
          from_name?: string | null;
          id?: string;
          is_read?: boolean;
          linked_budget_item_id?: string | null;
          linked_task_id?: string | null;
          linked_vendor_id?: string | null;
          provider_message_id?: string | null;
          received_at?: string;
          subject?: string;
          to_address: string;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          attachments?: Json;
          body_html?: string | null;
          body_text?: string | null;
          created_at?: string;
          from_address?: string;
          from_name?: string | null;
          id?: string;
          is_read?: boolean;
          linked_budget_item_id?: string | null;
          linked_task_id?: string | null;
          linked_vendor_id?: string | null;
          provider_message_id?: string | null;
          received_at?: string;
          subject?: string;
          to_address?: string;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emails_linked_budget_item_id_wedding_id_fkey";
            columns: ["linked_budget_item_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "budget_items";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "emails_linked_task_id_wedding_id_fkey";
            columns: ["linked_task_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "emails_linked_vendor_id_wedding_id_fkey";
            columns: ["linked_vendor_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "emails_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          all_day: boolean;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          location: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          all_day?: boolean;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          location?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          all_day?: boolean;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          location?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: {
          created_at: string;
          email: string | null;
          first_name: string;
          household_id: string;
          id: string;
          is_child: boolean;
          last_name: string | null;
          meal_choice: string | null;
          notes: string | null;
          phone: string | null;
          plus_one_allowed: boolean;
          rsvp: Database["public"]["Enums"]["rsvp_status"];
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_name: string;
          household_id: string;
          id?: string;
          is_child?: boolean;
          last_name?: string | null;
          meal_choice?: string | null;
          notes?: string | null;
          phone?: string | null;
          plus_one_allowed?: boolean;
          rsvp?: Database["public"]["Enums"]["rsvp_status"];
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_name?: string;
          household_id?: string;
          id?: string;
          is_child?: boolean;
          last_name?: string | null;
          meal_choice?: string | null;
          notes?: string | null;
          phone?: string | null;
          plus_one_allowed?: boolean;
          rsvp?: Database["public"]["Enums"]["rsvp_status"];
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guests_household_id_wedding_id_fkey";
            columns: ["household_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "guests_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      households: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          postal_code: string | null;
          region: string | null;
          side: Database["public"]["Enums"]["guest_side"];
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          postal_code?: string | null;
          region?: string | null;
          side?: Database["public"]["Enums"]["guest_side"];
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          postal_code?: string | null;
          region?: string | null;
          side?: Database["public"]["Enums"]["guest_side"];
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "households_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      idea_boards: {
        Row: {
          category: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          title: string;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          title: string;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idea_boards_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      idea_items: {
        Row: {
          board_id: string;
          caption: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          link_url: string | null;
          photo_path: string | null;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          board_id: string;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          link_url?: string | null;
          photo_path?: string | null;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          board_id?: string;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          link_url?: string | null;
          photo_path?: string | null;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idea_items_board_id_wedding_id_fkey";
            columns: ["board_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "idea_boards";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "idea_items_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          expires_at: string;
          id: string;
          role: Database["public"]["Enums"]["member_role"];
          token: string;
          updated_at: string;
          wedding_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
          updated_at?: string;
          wedding_id: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
          updated_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invites_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          role: Database["public"]["Enums"]["member_role"];
          updated_at: string;
          user_id: string;
          wedding_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id?: string;
          role: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id: string;
          wedding_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          idea_item_id: string;
          updated_at: string;
          user_id: string;
          wedding_id: string;
        };
        Insert: {
          created_at?: string;
          emoji?: string;
          id?: string;
          idea_item_id: string;
          updated_at?: string;
          user_id?: string;
          wedding_id: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          idea_item_id?: string;
          updated_at?: string;
          user_id?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_idea_item_id_wedding_id_fkey";
            columns: ["idea_item_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "idea_items";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "reactions_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      registry_links: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          store_name: string;
          updated_at: string;
          url: string;
          wedding_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          store_name: string;
          updated_at?: string;
          url: string;
          wedding_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          store_name?: string;
          updated_at?: string;
          url?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registry_links_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assignee_id: string | null;
          category: string | null;
          completed_at: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          months_before: number | null;
          notes: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["task_status"];
          template_id: string | null;
          title: string;
          updated_at: string;
          vendor_id: string | null;
          wedding_id: string;
        };
        Insert: {
          assignee_id?: string | null;
          category?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          months_before?: number | null;
          notes?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["task_status"];
          template_id?: string | null;
          title: string;
          updated_at?: string;
          vendor_id?: string | null;
          wedding_id: string;
        };
        Update: {
          assignee_id?: string | null;
          category?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          months_before?: number | null;
          notes?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["task_status"];
          template_id?: string | null;
          title?: string;
          updated_at?: string;
          vendor_id?: string | null;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_wedding_id_fkey";
            columns: ["assignee_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "tasks_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "checklist_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_vendor_id_wedding_id_fkey";
            columns: ["vendor_id", "wedding_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "wedding_id"];
          },
          {
            foreignKeyName: "tasks_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      vendors: {
        Row: {
          contact_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["vendor_status"];
          type: string | null;
          updated_at: string;
          website: string | null;
          wedding_id: string;
        };
        Insert: {
          contact_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["vendor_status"];
          type?: string | null;
          updated_at?: string;
          website?: string | null;
          wedding_id: string;
        };
        Update: {
          contact_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["vendor_status"];
          type?: string | null;
          updated_at?: string;
          website?: string | null;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      weddings: {
        Row: {
          budget_total: number | null;
          created_at: string;
          created_by: string | null;
          email_slug: string;
          guest_count_estimate: number | null;
          id: string;
          partner1_name: string;
          partner2_name: string | null;
          updated_at: string;
          wedding_date: string | null;
        };
        Insert: {
          budget_total?: number | null;
          created_at?: string;
          created_by?: string | null;
          email_slug: string;
          guest_count_estimate?: number | null;
          id?: string;
          partner1_name: string;
          partner2_name?: string | null;
          updated_at?: string;
          wedding_date?: string | null;
        };
        Update: {
          budget_total?: number | null;
          created_at?: string;
          created_by?: string | null;
          email_slug?: string;
          guest_count_estimate?: number | null;
          id?: string;
          partner1_name?: string;
          partner2_name?: string | null;
          updated_at?: string;
          wedding_date?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invite: {
        Args: { _display_name?: string; _token: string };
        Returns: string;
      };
      create_wedding: {
        Args: {
          _budget_total?: number;
          _display_name?: string;
          _guest_count_estimate?: number;
          _partner1_name: string;
          _partner2_name?: string;
          _wedding_date?: string;
        };
        Returns: {
          budget_total: number | null;
          created_at: string;
          created_by: string | null;
          email_slug: string;
          guest_count_estimate: number | null;
          id: string;
          partner1_name: string;
          partner2_name: string | null;
          updated_at: string;
          wedding_date: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "weddings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_invite: {
        Args: { _token: string };
        Returns: {
          accepted: boolean;
          email: string;
          expired: boolean;
          partner1_name: string;
          partner2_name: string;
          role: Database["public"]["Enums"]["member_role"];
          wedding_date: string;
          wedding_id: string;
        }[];
      };
    };
    Enums: {
      guest_side: "partner1" | "partner2" | "both";
      member_role: "couple" | "planner" | "helper";
      rsvp_status: "pending" | "attending" | "declined";
      task_status: "todo" | "in_progress" | "done" | "booked";
      vendor_status: "considering" | "contacted" | "booked" | "declined";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      guest_side: ["partner1", "partner2", "both"],
      member_role: ["couple", "planner", "helper"],
      rsvp_status: ["pending", "attending", "declined"],
      task_status: ["todo", "in_progress", "done", "booked"],
      vendor_status: ["considering", "contacted", "booked", "declined"],
    },
  },
} as const;

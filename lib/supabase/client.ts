import { createClient } from "@supabase/supabase-js";

// Supabaseクライアント（Service Role Key使用 - Server Actionsのみで使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("警告: Supabase環境変数が設定されていません。.env.localを確認してください。");
}

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : createClient("https://placeholder.supabase.co", "placeholder-key", {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

// Database型定義
export interface Database {
  public: {
    Tables: {
      inventories: {
        Row: {
          id: string;
          user_id: string;
          body: number;
          bottom: number;
          lid: number;
          rolls: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          body?: number;
          bottom?: number;
          lid?: number;
          rolls?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          body?: number;
          bottom?: number;
          lid?: number;
          rolls?: number;
          last_updated?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          customer_name: string;
          delivery_date: string;
          set_quantity: number;
          additional_lids: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          customer_name: string;
          delivery_date: string;
          set_quantity?: number;
          additional_lids?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          customer_name?: string;
          delivery_date?: string;
          set_quantity?: number;
          additional_lids?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

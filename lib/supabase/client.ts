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
          office_body: number;
          office_bottom: number;
          office_lid: number;
          office_rolls: number;
          office_pail_body: number;
          office_pail_bottom: number;
          office_pail_lid: number;
          office_pail_rolls: number;
          sugisaki_body: number;
          sugisaki_bottom: number;
          sugisaki_lid: number;
          sugisaki_rolls: number;
          sugisaki_pail_body: number;
          sugisaki_pail_bottom: number;
          sugisaki_pail_lid: number;
          sugisaki_pail_rolls: number;
          manufacturer_body: number;
          manufacturer_bottom: number;
          manufacturer_lid: number;
          manufacturer_rolls: number;
          manufacturer_pail_body: number;
          manufacturer_pail_bottom: number;
          manufacturer_pail_lid: number;
          manufacturer_pail_rolls: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          office_body?: number;
          office_bottom?: number;
          office_lid?: number;
          office_rolls?: number;
          office_pail_body?: number;
          office_pail_bottom?: number;
          office_pail_lid?: number;
          office_pail_rolls?: number;
          sugisaki_body?: number;
          sugisaki_bottom?: number;
          sugisaki_lid?: number;
          sugisaki_rolls?: number;
          sugisaki_pail_body?: number;
          sugisaki_pail_bottom?: number;
          sugisaki_pail_lid?: number;
          sugisaki_pail_rolls?: number;
          manufacturer_body?: number;
          manufacturer_bottom?: number;
          manufacturer_lid?: number;
          manufacturer_rolls?: number;
          manufacturer_pail_body?: number;
          manufacturer_pail_bottom?: number;
          manufacturer_pail_lid?: number;
          manufacturer_pail_rolls?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          office_body?: number;
          office_bottom?: number;
          office_lid?: number;
          office_rolls?: number;
          office_pail_body?: number;
          office_pail_bottom?: number;
          office_pail_lid?: number;
          office_pail_rolls?: number;
          sugisaki_body?: number;
          sugisaki_bottom?: number;
          sugisaki_lid?: number;
          sugisaki_rolls?: number;
          sugisaki_pail_body?: number;
          sugisaki_pail_bottom?: number;
          sugisaki_pail_lid?: number;
          sugisaki_pail_rolls?: number;
          manufacturer_body?: number;
          manufacturer_bottom?: number;
          manufacturer_lid?: number;
          manufacturer_rolls?: number;
          manufacturer_pail_body?: number;
          manufacturer_pail_bottom?: number;
          manufacturer_pail_lid?: number;
          manufacturer_pail_rolls?: number;
          last_updated?: string;
        };
      };
      inventory_transfers: {
        Row: {
          id: string;
          user_id: string;
          from_location: string;
          to_location: string;
          item_type: string;
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_location: string;
          to_location: string;
          item_type: string;
          quantity: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_location?: string;
          to_location?: string;
          item_type?: string;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          product_type: string;
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
          product_type?: string;
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
          product_type?: string;
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

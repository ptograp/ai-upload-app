// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epoxsnrliezywbrwbmeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwb3hzbnJsaWV6eXdicndibWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwODM0NDksImV4cCI6MjA2NDY1OTQ0OX0.TO9FyuyKxWgL56q4-McKLPrtt8UUqCobZ7UR-ZERHF4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

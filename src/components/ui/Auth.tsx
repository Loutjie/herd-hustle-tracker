import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'

export default function AuthUI() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="max-w-md w-full p-6 bg-card rounded-lg shadow">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  )
}

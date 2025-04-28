
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast.error('Password reset failed', {
          description: error.message
        });
      } else {
        toast.success('Password reset email sent', {
          description: 'Check your email for the password reset link'
        });
        setIsForgotPassword(false);
      }
      return;
    }
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Login failed', {
        description: error.message
      });
    } else {
      toast.success('Logged in successfully');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isForgotPassword ? 'Reset Password' : 'Login to Fandoro'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              required 
            />
          </div>
          {!isForgotPassword && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                required 
              />
            </div>
          )}
          <Button type="submit" className="w-full">
            {isForgotPassword ? 'Send Reset Link' : 'Login'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setIsForgotPassword(!isForgotPassword)}
          >
            {isForgotPassword ? 'Back to Login' : 'Forgot Password?'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

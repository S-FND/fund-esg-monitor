
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SetupAdminPage = () => {
  const [password, setPassword] = useState('FanDoro@25');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await updatePassword(password);
    
    if (error) {
      toast.error('Failed to set password', {
        description: error.message
      });
    } else {
      toast.success('Password set successfully');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Setup Admin Password</h2>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block mb-2">New Password</label>
            <Input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password" 
              required 
            />
          </div>
          <Button type="submit" className="w-full">
            Set Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetupAdminPage;

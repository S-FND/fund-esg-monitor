
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast.error('Password update failed', {
        description: error.message
      });
    } else {
      toast.success('Password updated successfully');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input 
              type="password" 
              id="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password" 
              required 
            />
          </div>
          <Button type="submit" className="w-full">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

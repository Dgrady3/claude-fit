import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpdateUser } from '../api/hooks';
import { api } from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout, demoMode } = useAuth();
  const updateUserMutation = useUpdateUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);

  // Handle Oura OAuth callback redirect
  useEffect(() => {
    const ouraStatus = searchParams.get('oura');
    if (ouraStatus === 'connected') {
      toast.success('Oura Ring connected successfully!');
      searchParams.delete('oura');
      setSearchParams(searchParams, { replace: true });
    } else if (ouraStatus === 'error') {
      toast.error('Failed to connect Oura Ring. Please try again.');
      searchParams.delete('oura');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [form, setForm] = useState({
    name: '',
    body_weight: '',
    height_inches: '',
    age: '',
    sex: '',
    target_weight: '',
    target_body_fat: '',
    daily_protein_target: '',
    daily_calorie_target: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        body_weight: user.body_weight || '',
        height_inches: user.height_inches || '',
        age: user.age || '',
        sex: user.sex || '',
        target_weight: user.target_weight || '',
        target_body_fat: user.target_body_fat || '',
        daily_protein_target: user.daily_protein_target || '',
        daily_calorie_target: user.daily_calorie_target || '',
      });
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const result = await updateUserMutation.mutateAsync(form);
      updateUser(result.user || result);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConnectOura = () => {
    window.location.href = '/api/v1/oura/authorize';
  };

  const handleSyncOura = async () => {
    setSyncing(true);
    try {
      await api.post('/oura/sync');
      toast.success('Oura data synced!');
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-100">Settings</h1>

      {demoMode && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 text-sm text-amber-400">
          Settings are view-only in demo mode.
        </div>
      )}

      {/* Profile */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Profile</h2>
        <Input
          label="Name"
          value={form.name}
          onChange={handleChange('name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Body Weight (lbs)"
            type="number"
            inputMode="decimal"
            value={form.body_weight}
            onChange={handleChange('body_weight')}
            placeholder="185"
          />
          <Input
            label="Height (in)"
            type="number"
            inputMode="numeric"
            value={form.height_inches}
            onChange={handleChange('height_inches')}
            placeholder="72"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            value={form.age}
            onChange={handleChange('age')}
            placeholder="30"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Sex</label>
            <select
              value={form.sex}
              onChange={handleChange('sex')}
              className="w-full px-3 py-2.5 rounded-lg bg-dark-700 border border-dark-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[44px]"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Goals */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Goals</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target Weight (lbs)"
            type="number"
            inputMode="decimal"
            value={form.target_weight}
            onChange={handleChange('target_weight')}
            placeholder="180"
          />
          <Input
            label="Target Body Fat %"
            type="number"
            inputMode="decimal"
            value={form.target_body_fat}
            onChange={handleChange('target_body_fat')}
            placeholder="15"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Daily Protein (g)"
            type="number"
            inputMode="numeric"
            value={form.daily_protein_target}
            onChange={handleChange('daily_protein_target')}
            placeholder="180"
          />
          <Input
            label="Daily Calories"
            type="number"
            inputMode="numeric"
            value={form.daily_calorie_target}
            onChange={handleChange('daily_calorie_target')}
            placeholder="2500"
          />
        </div>
      </Card>

      {/* Integrations */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Integrations</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-200">Oura Ring</p>
            <p className="text-xs text-gray-500">
              {user?.oura_connected ? 'Connected' : 'Sync sleep, HRV, and recovery data'}
            </p>
          </div>
          {!demoMode && (
            <div className="flex gap-2">
              {user?.oura_connected && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={syncing}
                  onClick={handleSyncOura}
                >
                  Sync Now
                </Button>
              )}
              <Button
                variant={user?.oura_connected ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleConnectOura}
              >
                {user?.oura_connected ? 'Reconnect' : 'Connect'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Save */}
      {!demoMode && (
        <Button
          onClick={handleSave}
          loading={updateUserMutation.isPending}
          size="lg"
          className="w-full"
        >
          Save Settings
        </Button>
      )}

      {/* Logout (mobile) */}
      <div className="lg:hidden pt-4 border-t border-dark-600/50">
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

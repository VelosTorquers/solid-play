
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LogOut, User, Settings, MessageSquare, CheckSquare, Users, HelpCircle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-lg border-b border-neutral-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-black">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SOLID Dashboard</h1>
              <p className="text-sm text-neutral-400">Welcome back, {profile?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-neutral-300">
              <User className="h-4 w-4" />
              <span className="text-sm">
                {profile?.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-neutral-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-black/60 backdrop-blur-lg border-r border-neutral-800 min-h-[calc(100vh-73px)]">
          <nav className="p-6 space-y-2">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              Main Menu
            </div>
            
            <NavItem icon={BarChart3} label="Overview" active />
            <NavItem icon={MessageSquare} label="Chat" />
            <NavItem icon={CheckSquare} label="Tasks" />
            <NavItem icon={Users} label="Members" />
            <NavItem icon={HelpCircle} label="Doubts & Q&A" />
            
            {profile?.role === 'admin' && (
              <>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 mt-8">
                  Admin
                </div>
                <NavItem icon={Settings} label="Settings" />
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
              <p className="text-neutral-400">
                Manage your team collaboration and track progress
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard title="Total Tasks" value="12" icon={CheckSquare} />
              <StatsCard title="Active Members" value="8" icon={Users} />
              <StatsCard title="Open Doubts" value="3" icon={HelpCircle} />
              <StatsCard title="Messages" value="156" icon={MessageSquare} />
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-lg border border-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard 
                  title="Send Message" 
                  description="Start a conversation with your team"
                  icon={MessageSquare}
                />
                <QuickActionCard 
                  title="Create Task" 
                  description="Assign new tasks to team members"
                  icon={CheckSquare}
                />
                <QuickActionCard 
                  title="Ask Question" 
                  description="Post a doubt or question"
                  icon={HelpCircle}
                />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
      active 
        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
        : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
    }`}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function StatsCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <div className="bg-black/40 backdrop-blur-lg border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-amber-400" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
  return (
    <button className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 text-left hover:bg-neutral-800/50 transition-colors group">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-yellow-600/30 transition-colors">
          <Icon className="h-4 w-4 text-amber-400" />
        </div>
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-neutral-400">{description}</p>
    </button>
  );
}

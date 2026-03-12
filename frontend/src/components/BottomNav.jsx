import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, PlusCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
    const { isAuthenticated } = useAuth();

    const navItemClass = ({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-[64px] bg-background/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pb-safe md:hidden">
            <NavLink to="/" className={navItemClass} end>
                <Home size={22} />
                <span className="text-[10px] font-medium">Home</span>
            </NavLink>
            <NavLink to="/feed" className={navItemClass}>
                <List size={22} />
                <span className="text-[10px] font-medium">Feed</span>
            </NavLink>
            <NavLink to="/report" className="relative -top-4 flex flex-col items-center justify-center">
                <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                    <PlusCircle size={26} fill="currentColor" stroke="var(--primary)" strokeWidth={1.5} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-foreground mt-1">Report</span>
            </NavLink>
            {isAuthenticated ? (
                <NavLink to="/profile" className={navItemClass}>
                    <User size={22} />
                    <span className="text-[10px] font-medium">Profile</span>
                </NavLink>
            ) : (
                <NavLink to="/login" className={navItemClass}>
                    <User size={22} />
                    <span className="text-[10px] font-medium">Login</span>
                </NavLink>
            )}
        </nav>
    );
}

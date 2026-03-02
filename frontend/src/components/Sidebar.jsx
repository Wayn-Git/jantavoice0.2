import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaHome, FaList, FaHistory, FaPlusCircle,
    FaBuilding, FaRobot, FaFileAlt, FaUserShield, FaUser
} from 'react-icons/fa';

export default function Sidebar() {
    const { user, isAuthenticated } = useAuth();

    const navItemClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${isActive
            ? 'bg-saffron text-white shadow-md'
            : 'text-gray-500 hover:bg-saffron/10 hover:text-saffron'
        }`;

    return (
        <aside className="fixed left-0 top-[60px] w-60 h-[calc(100vh-60px)] bg-white border-r border-gray-200 overflow-y-auto flex flex-col hide-scrollbar">
            <div className="p-4 flex-1 flex flex-col gap-6">

                {/* Main Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Main</h3>
                    <div className="flex flex-col gap-1">
                        <NavLink to="/feed" className={navItemClass}>
                            <FaHome className="text-lg" />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/feed?tab=all" className={navItemClass}>
                            <FaList className="text-lg" />
                            <span>All Complaints</span>
                        </NavLink>
                        {isAuthenticated && (
                            <NavLink to="/my-complaints" className={navItemClass}>
                                <FaHistory className="text-lg" />
                                <span>My Complaints</span>
                            </NavLink>
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Features</h3>
                    <div className="flex flex-col gap-1">
                        <NavLink to="/report" className={navItemClass}>
                            <FaPlusCircle className="text-lg" />
                            <span>File Complaint</span>
                        </NavLink>
                        {isAuthenticated && (
                            <NavLink to="/gov-tracking" className={navItemClass}>
                                <FaBuilding className="text-lg" />
                                <span>Gov Portals</span>
                            </NavLink>
                        )}
                        {user?.role === 'admin' && (
                            <NavLink to="/automation-admin" className={navItemClass}>
                                <FaRobot className="text-lg" />
                                <span>Automation</span>
                            </NavLink>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/letters" className={navItemClass}>
                                <FaFileAlt className="text-lg" />
                                <span>Letters</span>
                            </NavLink>
                        )}
                    </div>
                </div>

                {/* Account Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Account</h3>
                    <div className="flex flex-col gap-1">
                        {user?.role === 'admin' && (
                            <NavLink to="/admin" className={navItemClass}>
                                <FaUserShield className="text-lg" />
                                <span>Admin Panel</span>
                            </NavLink>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/profile" className={navItemClass}>
                                <FaUser className="text-lg" />
                                <span>Profile</span>
                            </NavLink>
                        )}
                    </div>
                </div>

            </div>

            {/* Stats Card at Bottom */}
            {isAuthenticated && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
                        <p className="text-xs font-bold text-gray-500 mb-1">My Impact Phase</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                            <div className="bg-saffron h-full w-1/3"></div>
                        </div>
                        <p className="text-[10px] text-gray-400">Civic Contributor</p>
                    </div>
                </div>
            )}
        </aside>
    );
}

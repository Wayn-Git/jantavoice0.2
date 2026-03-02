import React, { useState, useEffect } from 'react';
import { automationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaRobot, FaPlay, FaToggleOn, FaToggleOff, FaHistory, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function AutomationAdminPage() {
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, logsRes] = await Promise.all([
                automationAPI.getRules(),
                automationAPI.getLogs()
            ]);
            setRules(rulesRes.data.rules);
            setLogs(rulesRes.data.logs);
        } catch (err) {
            toast.error('Failed to load automation data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (ruleId) => {
        try {
            await automationAPI.toggleRule(ruleId);
            toast.success('Rule status updated');
            fetchData();
        } catch (err) {
            toast.error('Failed to toggle rule');
        }
    };

    const handleRunNow = async () => {
        setRunning(true);
        toast.loading('Starting engine execution...', { id: 'run' });
        try {
            const { data } = await automationAPI.runNow();
            toast.success(data.message || 'Execution completed', { id: 'run' });
            fetchData();
        } catch (err) {
            toast.error('Manual execution failed', { id: 'run' });
        } finally {
            setRunning(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-saffron border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-800 flex items-center gap-3">
                        <FaRobot className="text-saffron" />
                        Automation Engine
                    </h1>
                    <p className="text-gray-500">Manage background jobs, AI triggers, and view automated tracking logs.</p>
                </div>
                <button
                    onClick={handleRunNow}
                    disabled={running}
                    className={`px-6 py-2.5 rounded-lg font-bold text-white shadow-sm flex items-center gap-2 transition-all ${running ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-black hover:-translate-y-0.5'}`}
                >
                    {running ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <FaPlay className="text-sm" />}
                    Deploy Engine Now
                </button>
            </div>

            {/* Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map(rule => (
                    <div key={rule._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative overflow-hidden group">
                        {/* Active Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.isActive ? 'bg-india-green' : 'bg-gray-300'}`}></div>

                        <div className="flex justify-between items-start mb-3 pl-2">
                            <h3 className="font-bold text-gray-800 text-sm">{rule.name}</h3>
                            <button
                                onClick={() => handleToggle(rule._id)}
                                className={`text-2xl transition-colors ${rule.isActive ? 'text-india-green hover:text-india-green-dark' : 'text-gray-300 hover:text-gray-500'}`}
                            >
                                {rule.isActive ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 pl-2 h-10">{rule.description}</p>

                        <div className="pl-2 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-mono">ID: {rule.id}</span>
                            <span className="font-bold text-saffron bg-saffron/10 px-2 py-1 rounded">Runs: {rule.runCount}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Execution Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <FaHistory className="text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-800">Recent Executions (Last 50)</h2>
                </div>

                {logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p>No actions have been executed by the engine yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Rule Initiator</th>
                                    <th className="p-4">Target Complaint</th>
                                    <th className="p-4">Engine Action</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-sm">
                                        <td className="p-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">{log.ruleName}</td>
                                        <td className="p-4 text-gray-600 truncate max-w-xs">{log.complaintTitle || 'Unknown / Deleted'}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-xs font-mono">
                                                {log.action}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{log.result}</p>
                                        </td>
                                        <td className="p-4">
                                            {log.success ? (
                                                <FaCheckCircle className="text-india-green text-lg" title="Success" />
                                            ) : (
                                                <FaTimesCircle className="text-red-500 text-lg" title="Failed" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}

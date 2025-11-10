import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, BookOpen, GraduationCap, Building2, DoorOpen, UserCircle } from 'lucide-react';
import './Dashboard.css';

import Students from './Students';
import Courses from './Courses';
import Teachers from './Teachers';
import Enrollments from './Enrollments';
import Departments from './Departments';
import Classrooms from './Classrooms';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'enrollments', label: 'Enrollments', icon: UserCircle },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'classrooms', label: 'Classrooms', icon: DoorOpen }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'students': return <Students />;
      case 'courses': return <Courses />;
      case 'teachers': return <Teachers />;
      case 'enrollments': return <Enrollments />;
      case 'departments': return <Departments />;
      case 'classrooms': return <Classrooms />;
      default: return <Students />;
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <GraduationCap size={32} />
          <span>Student Management</span>
        </div>
        <div className="navbar-user">
          <span>Welcome, {username}</span>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        <aside className="sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

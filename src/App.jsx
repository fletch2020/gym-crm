import React, { useState } from 'react';
import { Users, Calendar, Dumbbell, Plus, X, Check, AlertCircle, LogOut, Clock } from 'lucide-react';

const GymCRM = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '', phone: '' });
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [members, setMembers] = useState([
    { id: 1, name: 'Jake Smith', email: 'jake@email.com', password: 'pass123', phone: '07700 900123', joined: '2024-01', credits: 48.00, isAdmin: false },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@email.com', password: 'pass123', phone: '07700 900456', joined: '2023-06', credits: 24.00, isAdmin: false },
    { id: 999, name: 'Admin User', email: 'admin@gym.com', password: 'admin123', phone: '07700 999999', joined: '2020-01', credits: 0, isAdmin: true },
  ]);
  
  const [bookings, setBookings] = useState([
    { id: 1, memberId: 1, sessionKey: 'mon-morning-academy', date: '2026-01-20', attended: false, type: 'class' },
    { id: 2, memberId: 2, sessionKey: 'mon-morning-academy', date: '2026-01-20', attended: false, type: 'class' },
    { id: 3, memberId: 1, sessionKey: 'gym-access', date: '2026-01-22', attended: false, type: 'gym' },
  ]);

  const [showBookSession, setShowBookSession] = useState(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showGymAccess, setShowGymAccess] = useState(false);
  const [gymAccessDate, setGymAccessDate] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-01-20');
  const [classOverrides, setClassOverrides] = useState({});

  const schedule = [
    { day: 'Monday', time: '9:20-10:20', type: 'Academy', key: 'mon-morning-academy' },
    { day: 'Monday', time: '4:30-5:30', type: 'Battle Camp', key: 'mon-evening1-battlecamp' },
    { day: 'Tuesday', time: '6:00-7:00', type: 'Battle Camp', key: 'tue-morning-battlecamp' },
    { day: 'Wednesday', time: '5:40-6:40', type: 'Academy', key: 'wed-evening1-academy' },
    { day: 'Thursday', time: '8:00-9:00', type: 'Academy', key: 'thu-morning-academy' },
    { day: 'Friday', time: '6:00-7:00', type: 'Academy', key: 'fri-morning1-academy' },
    { day: 'Saturday', time: '8:20-9:20', type: 'Academy', key: 'sat-morning1-academy' },
  ];

  const handleLogin = () => {
    const user = members.find(m => m.email === loginEmail && m.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setActiveTab(user.isAdmin ? 'gym-access' : 'book-classes');
    } else {
      alert('Invalid login credentials');
    }
  };

  const handleSignUp = () => {
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (members.find(m => m.email === signUpData.email)) {
      alert('An account with this email already exists');
      return;
    }

    const newMember = {
      id: members.length + 1,
      name: signUpData.name,
      email: signUpData.email,
      password: signUpData.password,
      phone: signUpData.phone,
      joined: new Date().toISOString().slice(0, 7),
      credits: 0,
      isAdmin: false
    };

    setMembers([...members, newMember]);
    setCurrentUser(newMember);
    setSignUpData({ name: '', email: '', password: '', phone: '' });
    setShowSignUp(false);
    setActiveTab('book-classes');
    alert('Account created successfully! Please top up credits to start booking.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const bookGymAccess = () => {
    if (!gymAccessDate || currentUser.credits < 5) return;

    setBookings([...bookings, {
      id: bookings.length + 1,
      memberId: currentUser.id,
      sessionKey: 'gym-access',
      date: gymAccessDate,
      attended: false,
      type: 'gym'
    }]);

    const newCredits = currentUser.credits - 5;
    setMembers(members.map(m => m.id === currentUser.id ? { ...m, credits: newCredits } : m));
    setCurrentUser({ ...currentUser, credits: newCredits });
    setGymAccessDate('');
    setShowGymAccess(false);
  };

  const addBooking = () => {
    if (!showBookSession || currentUser.credits < 6) return;

    setBookings([...bookings, {
      id: bookings.length + 1,
      memberId: currentUser.id,
      sessionKey: showBookSession.key,
      date: selectedDate,
      attended: false,
      type: 'class'
    }]);

    const newCredits = currentUser.credits - 6;
    setMembers(members.map(m => m.id === currentUser.id ? { ...m, credits: newCredits } : m));
    setCurrentUser({ ...currentUser, credits: newCredits });
    setShowBookSession(null);
  };

  const canCancelBooking = (booking) => {
    if (booking.attended) return { can: false, reason: 'Already attended' };
    
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    if (booking.type === 'class') {
      const session = schedule.find(s => s.key === booking.sessionKey);
      if (session) {
        const timeMatch = session.time.match(/(\d+):(\d+)/);
        if (timeMatch) {
          bookingDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
        }
      }
    } else {
      bookingDate.setHours(23, 59);
    }
    
    const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
    return hoursUntil >= 24 ? { can: true } : { can: false, reason: 'Cannot cancel within 24 hours' };
  };

  const removeBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const cancelCheck = canCancelBooking(booking);
    if (!cancelCheck.can) {
      alert(cancelCheck.reason);
      return;
    }

    const refund = booking.type === 'gym' ? 5 : 6;
    setBookings(bookings.filter(b => b.id !== bookingId));
    
    const newCredits = currentUser.credits + refund;
    setMembers(members.map(m => m.id === booking.memberId ? { ...m, credits: newCredits } : m));
    if (currentUser.id === booking.memberId) {
      setCurrentUser({ ...currentUser, credits: newCredits });
    }
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;

    const newCredits = currentUser.credits + amount;
    setMembers(members.map(m => m.id === currentUser.id ? { ...m, credits: newCredits } : m));
    setCurrentUser({ ...currentUser, credits: newCredits });
    setTopUpAmount('');
    setShowTopUp(false);
  };

  const getSessionBookings = (sessionKey, date) => {
    return bookings.filter(b => b.sessionKey === sessionKey && b.date === date && b.type === 'class');
  };

  const getGymAccessBookings = (date) => {
    return bookings.filter(b => b.type === 'gym' && b.date === date);
  };

  const toggleOverride = (sessionKey, date) => {
    const key = `${sessionKey}-${date}`;
    setClassOverrides({
      ...classOverrides,
      [key]: !classOverrides[key]
    });
  };

  const getClassStatus = (sessionKey, date) => {
    const count = getSessionBookings(sessionKey, date).length;
    const overrideKey = `${sessionKey}-${date}`;
    const isOverridden = classOverrides[overrideKey];
    
    if (count >= 4) return { status: 'running', color: 'bg-green-600', text: 'Running' };
    if (isOverridden) return { status: 'override', color: 'bg-amber-600', text: 'Override - Running' };
    return { status: 'cancelled', color: 'bg-red-600', text: 'Cancelled' };
  };

  const getMemberName = (id) => {
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Dumbbell className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h1 className="text-3xl font-bold">Fitness Studio</h1>
            <p className="text-slate-400 mt-2">Member Portal</p>
          </div>

          {!showSignUp ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold"
                >
                  Login
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-slate-400 mb-3">Don't have an account?</p>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold"
                >
                  Sign Up as New Member
                </button>
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded text-sm">
                <p className="font-semibold mb-2">Demo Accounts:</p>
                <p>Admin: admin@gym.com / admin123</p>
                <p>Member: jake@email.com / pass123</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-6">Create New Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <input
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="07700 900000"
                  />
                </div>
                <div className="bg-blue-900 bg-opacity-30 border border-blue-600 p-3 rounded text-sm">
                  <p className="text-blue-300">After signing up, you'll need to top up credits to start booking classes.</p>
                </div>
                <button
                  onClick={handleSignUp}
                  className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold"
                >
                  Create Account
                </button>
                <button
                  onClick={() => setShowSignUp(false)}
                  className="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8" />
                Fitness Studio {currentUser.isAdmin ? 'Manager' : ''}
              </h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                {currentUser.isAdmin ? 'Admin Dashboard' : `Welcome, ${currentUser.name}`}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              {!currentUser.isAdmin && (
                <div className="bg-blue-700 px-3 py-2 rounded-lg mb-2">
                  <div className="text-xs text-blue-200">Account Balance</div>
                  <div className="text-xl sm:text-2xl font-bold">£{currentUser.credits.toFixed(2)}</div>
                  <div className="text-xs text-blue-200">{Math.floor(currentUser.credits / 6)} classes | {Math.floor(currentUser.credits / 5)} gym visits</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {currentUser.isAdmin ? (
          <>
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 min-w-[140px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base ${
                  activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Classes
              </button>
              <button
                onClick={() => setActiveTab('gym-access')}
                className={`flex-1 min-w-[140px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base ${
                  activeTab === 'gym-access' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
                Gym
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 min-w-[140px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base ${
                  activeTab === 'members' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Members
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-4 py-2"
              />
            </div>

            {activeTab === 'schedule' && (
              <div className="grid gap-6">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const daySessions = schedule.filter(s => s.day === day);
                  if (daySessions.length === 0) return null;
                  
                  return (
                    <div key={day} className="bg-slate-800 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-4 text-blue-400">{day}</h3>
                      <div className="grid gap-4">
                        {daySessions.map((session) => {
                          const sessionBookings = getSessionBookings(session.key, selectedDate);
                          const count = sessionBookings.length;
                          const classStatus = getClassStatus(session.key, selectedDate);
                          
                          return (
                            <div key={session.key} className="bg-slate-700 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-semibold text-lg">{session.time}</div>
                                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                                    session.type === 'Academy' ? 'bg-blue-600' : 'bg-purple-600'
                                  }`}>
                                    {session.type}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`${classStatus.color} px-3 py-1 rounded-full text-sm font-semibold mb-2`}>
                                    {classStatus.text}
                                  </div>
                                  <div className="text-slate-400 text-sm">
                                    {count} / 4 minimum
                                  </div>
                                </div>
                              </div>

                              {count < 4 && (
                                <div className="bg-slate-800 p-3 rounded mb-3 flex items-center gap-2 text-amber-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">Class needs {4 - count} more to run</span>
                                  <button
                                    onClick={() => toggleOverride(session.key, selectedDate)}
                                    className="ml-auto bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-white text-sm"
                                  >
                                    {classStatus.status === 'override' ? 'Remove Override' : 'Override & Run'}
                                  </button>
                                </div>
                              )}

                              <div className="space-y-2">
                                <div className="text-sm font-semibold text-slate-300 mb-2">
                                  Bookings (£{count * 6} revenue):
                                </div>
                                {sessionBookings.map(booking => (
                                  <div key={booking.id} className="bg-slate-600 p-3 rounded flex justify-between items-center">
                                    <span className="font-medium">{getMemberName(booking.memberId)}</span>
                                    <button
                                      onClick={() => removeBooking(booking.id)}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                {count === 0 && (
                                  <div className="text-slate-500 text-sm">No bookings yet</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'gym-access' && (
              <div className="bg-slate-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Gym Access Bookings</h3>
                  <div className="text-slate-400">
                    {getGymAccessBookings(selectedDate).length} members | £{getGymAccessBookings(selectedDate).length * 5} revenue
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {getGymAccessBookings(selectedDate).map(booking => (
                    <div key={booking.id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{getMemberName(booking.memberId)}</div>
                        <div className="text-sm text-slate-400">General Gym Access - £5.00</div>
                      </div>
                      <button
                        onClick={() => removeBooking(booking.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {getGymAccessBookings(selectedDate).length === 0 && (
                    <div className="text-slate-500 text-center py-8">No gym access bookings for this date</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="grid gap-4">
                {members.filter(m => !m.isAdmin).map(member => {
                  const memberBookings = bookings.filter(b => b.memberId === member.id);
                  const upcomingBookings = memberBookings.filter(b => b.date >= selectedDate && !b.attended);
                  const attendedCount = memberBookings.filter(b => b.attended).length;
                  
                  return (
                    <div key={member.id} className="bg-slate-800 p-6 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{member.name}</h3>
                          <div className="mt-2 text-slate-400 text-sm space-y-1">
                            <div>📧 {member.email}</div>
                            <div>📱 {member.phone}</div>
                            <div>Member since: {new Date(member.joined).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-600 px-4 py-2 rounded-lg mb-2">
                            <div className="text-sm">Credits</div>
                            <div className="text-2xl font-bold">£{member.credits.toFixed(2)}</div>
                            <div className="text-xs">{Math.floor(member.credits / 6)} classes</div>
                          </div>
                          <div className="text-sm text-slate-400">
                            <div>{upcomingBookings.length} upcoming</div>
                            <div>{attendedCount} attended</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
              <button
                onClick={() => setActiveTab('book-classes')}
                className={`flex-1 min-w-[110px] px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base ${
                  activeTab === 'book-classes' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Book Classes</span>
                <span className="sm:hidden">Classes</span>
              </button>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`flex-1 min-w-[110px] px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base ${
                  activeTab === 'my-bookings' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">My Bookings</span>
                <span className="sm:hidden">Bookings</span>
              </button>
              <button
                onClick={() => setShowGymAccess(true)}
                className="flex-1 min-w-[110px] px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition text-sm sm:text-base"
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Book Gym</span>
                <span className="sm:hidden">Gym</span>
              </button>
              <button
                onClick={() => setShowTopUp(true)}
                className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition text-sm sm:text-base"
              >
                £ <span className="hidden sm:inline">Top Up Credits</span>
                <span className="sm:hidden">Top Up</span>
              </button>
            </div>

            {activeTab === 'book-classes' && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-4 py-2"
                  />
                </div>

                <div className="grid gap-6">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const daySessions = schedule.filter(s => s.day === day);
                    if (daySessions.length === 0) return null;
                    
                    return (
                      <div key={day} className="bg-slate-800 p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4 text-blue-400">{day}</h3>
                        <div className="grid gap-4">
                          {daySessions.map((session) => {
                            const myBooking = getSessionBookings(session.key, selectedDate)
                              .find(b => b.memberId === currentUser.id);
                            const sessionBookings = getSessionBookings(session.key, selectedDate);
                            
                            return (
                              <div key={session.key} className="bg-slate-700 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-semibold text-lg">{session.time}</div>
                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                                      session.type === 'Academy' ? 'bg-blue-600' : 'bg-purple-600'
                                    }`}>
                                      {session.type}
                                    </div>
                                  </div>
                                  <div className="text-slate-400 text-sm">
                                    {sessionBookings.length} booked
                                  </div>
                                </div>

                                {myBooking ? (
                                  <div className="bg-green-600 p-3 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-semibold">✓ Booked</span>
                                      <button
                                        onClick={() => removeBooking(myBooking.id)}
                                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    {!canCancelBooking(myBooking).can && (
                                      <div className="flex items-center gap-2 text-xs text-green-200">
                                        <Clock className="w-3 h-3" />
                                        <span>Cannot cancel within 24 hours</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowBookSession(session)}
                                    disabled={currentUser.credits < 6}
                                    className={`w-full px-4 py-3 rounded-lg font-semibold ${
                                      currentUser.credits < 6 ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                  >
                                    {currentUser.credits < 6 ? 'Insufficient Credits' : 'Book Class (£6.00)'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'my-bookings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
                
                <div className="bg-slate-800 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-700 p-3 sm:p-4 rounded-lg">
                      <div className="text-slate-400 text-xs sm:text-sm">Credits</div>
                      <div className="text-xl sm:text-2xl font-bold">£{currentUser.credits.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-700 p-3 sm:p-4 rounded-lg">
                      <div className="text-slate-400 text-xs sm:text-sm">Upcoming</div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {bookings.filter(b => b.memberId === currentUser.id && b.date >= selectedDate && !b.attended).length}
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Upcoming Bookings</h3>
                <div className="grid gap-3">
                  {bookings
                    .filter(b => b.memberId === currentUser.id && b.date >= selectedDate && !b.attended)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(booking => {
                      const session = booking.type === 'gym' ? null : schedule.find(s => s.key === booking.sessionKey);
                      const cancelCheck = canCancelBooking(booking);
                      
                      return (
                        <div key={booking.id} className="bg-slate-800 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">
                                {booking.type === 'gym' ? 'Gym Access' : `${session?.day} ${session?.time}`}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {booking.type === 'gym' ? 'General gym use - £5.00' : `${session?.type} - £6.00`}
                              </div>
                              <div className="text-slate-500 text-sm">{new Date(booking.date).toLocaleDateString('en-GB')}</div>
                              {!cancelCheck.can && (
                                <div className="flex items-center gap-2 text-xs text-amber-400 mt-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{cancelCheck.reason}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeBooking(booking.id)}
                              disabled={!cancelCheck.can}
                              className={`px-3 py-2 rounded text-sm ${
                                cancelCheck.can ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {showBookSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Booking</h3>
              <div className="space-y-3 mb-6">
                <div className="text-slate-300">
                  <span className="font-semibold">Class:</span> {showBookSession.day} {showBookSession.time}
                </div>
                <div className="text-slate-300">
                  <span className="font-semibold">Type:</span> {showBookSession.type}
                </div>
                <div className="text-slate-300">
                  <span className="font-semibold">Date:</span> {new Date(selectedDate).toLocaleDateString('en-GB')}
                </div>
                <div className="text-slate-300">
                  <span className="font-semibold">Cost:</span> £6.00
                </div>
                <div className="bg-amber-900 bg-opacity-30 border border-amber-600 p-3 rounded text-sm">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span>Can be cancelled up to 24 hours before class</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addBooking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => setShowBookSession(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showGymAccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Book Gym Access</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    value={gymAccessDate}
                    onChange={(e) => setGymAccessDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  />
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">General gym access for the day</div>
                  <div className="text-2xl font-bold">£5.00</div>
                </div>
                <div className="bg-amber-900 bg-opacity-30 border border-amber-600 p-3 rounded text-sm">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span>Can be cancelled up to 24 hours before</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={bookGymAccess}
                  disabled={currentUser.credits < 5 || !gymAccessDate}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    currentUser.credits < 5 || !gymAccessDate
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {currentUser.credits < 5 ? 'Insufficient Credits' : 'Book Gym Access'}
                </button>
                <button
                  onClick={() => {
                    setShowGymAccess(false);
                    setGymAccessDate('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showTopUp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Top Up Credits</h3>
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Current Balance: £{currentUser.credits.toFixed(2)}</div>
                <div className="text-sm text-slate-400 mb-4">Classes: £6.00 | Gym Access: £5.00</div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTopUpAmount('30')}
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg"
                  >
                    £30
                    <div className="text-xs text-slate-400">5 classes</div>
                  </button>
                  <button
                    onClick={() => setTopUpAmount('60')}
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg"
                  >
                    £60
                    <div className="text-xs text-slate-400">10 classes</div>
                  </button>
                  <button
                    onClick={() => setTopUpAmount('120')}
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg"
                  >
                    £120
                    <div className="text-xs text-slate-400">20 classes</div>
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Amount</label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    placeholder="Enter amount"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleTopUp}
                    className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                  >
                    Process Payment
                  </button>
                  <button
                    onClick={() => {
                      setShowTopUp(false);
                      setTopUpAmount('');
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymCRM;

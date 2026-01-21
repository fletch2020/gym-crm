import React, { useState, useEffect } from 'react';
import { Users, Calendar, Dumbbell, X, LogOut, Clock, AlertCircle } from 'lucide-react';

const GymCRM = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState('2026-01-20');
  const [showBookSession, setShowBookSession] = useState(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [classOverrides, setClassOverrides] = useState({});

  const schedule = [
    { day: 'Monday', time: '9:20-10:20', type: 'Academy', key: 'mon-morning-academy' },
    { day: 'Monday', time: '4:30-5:30', type: 'Battle Camp', key: 'mon-evening1-battlecamp' },
    { day: 'Tuesday', time: '6:00-7:00', type: 'Battle Camp', key: 'tue-morning-battlecamp' },
    { day: 'Thursday', time: '8:00-9:00', type: 'Academy', key: 'thu-morning-academy' },
    { day: 'Friday', time: '6:00-7:00', type: 'Academy', key: 'fri-morning1-academy' },
    { day: 'Saturday', time: '8:20-9:20', type: 'Academy', key: 'sat-morning1-academy' },
  ];

  // Check for saved session on load
  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setActiveTab(user.is_admin ? 'schedule' : 'book-classes');
      } catch (err) {
        sessionStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Fetch data from database
  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchOverrides = async () => {
    try {
      const res = await fetch('/api/overrides');
      const data = await res.json();
      const overridesObj = {};
      data.forEach(o => {
        overridesObj[`${o.session_key}-${o.date}`] = true;
      });
      setClassOverrides(overridesObj);
    } catch (err) {
      console.error('Error fetching overrides:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMembers();
      fetchBookings();
      fetchOverrides();
    }
  }, [currentUser]);

  // Auto-refresh data every 10 seconds when logged in
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        fetchMembers();
        fetchBookings();
        fetchOverrides();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        setActiveTab(user.is_admin ? 'schedule' : 'book-classes');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert('Login failed');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setLoginEmail('');
    setLoginPassword('');
  };

  const addBooking = async () => {
    if (!showBookSession || currentUser.credits < 6) return;
    setLoading(true);
    
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: currentUser.id,
          session_key: showBookSession.key,
          date: selectedDate,
          type: 'class'
        })
      });

      const newCredits = currentUser.credits - 6;
      await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, credits: newCredits })
      });

      await fetchMembers();
      await fetchBookings();
      
      const updatedMembers = await fetch('/api/members').then(r => r.json());
      const updatedUser = updatedMembers.find(m => m.id === currentUser.id);
      setCurrentUser(updatedUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setShowBookSession(null);
    } catch (err) {
      alert('Booking failed');
    }
    setLoading(false);
  };

  const removeBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setLoading(true);
    try {
      await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId })
      });

      const member = members.find(m => m.id === booking.member_id);
      const refund = booking.type === 'gym' ? 5 : 6;
      const newCredits = member.credits + refund;
      
      await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, credits: newCredits })
      });

      await fetchMembers();
      await fetchBookings();
      
      if (currentUser && booking.member_id === currentUser.id) {
        const updatedMembers = await fetch('/api/members').then(r => r.json());
        const updatedUser = updatedMembers.find(m => m.id === currentUser.id);
        setCurrentUser(updatedUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (err) {
      alert('Cancellation failed');
    }
    setLoading(false);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;

    setLoading(true);
    try {
      const newCredits = currentUser.credits + amount;
      await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, credits: newCredits })
      });

      await fetchMembers();
      const updatedMembers = await fetch('/api/members').then(r => r.json());
      const updatedUser = updatedMembers.find(m => m.id === currentUser.id);
      setCurrentUser(updatedUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setTopUpAmount('');
      setShowTopUp(false);
      alert(`£${amount.toFixed(2)} added to your account`);
    } catch (err) {
      alert('Top up failed');
    }
    setLoading(false);
  };

  const toggleOverride = async (sessionKey, date) => {
    const key = `${sessionKey}-${date}`;
    const newValue = !classOverrides[key];

    setLoading(true);
    try {
      await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_key: sessionKey,
          date: date,
          is_overridden: newValue
        })
      });

      // Immediately update local state
      const newOverrides = { ...classOverrides };
      if (newValue) {
        newOverrides[key] = true;
      } else {
        delete newOverrides[key];
      }
      setClassOverrides(newOverrides);
      
      // Also fetch from database to be sure
      await fetchOverrides();
    } catch (err) {
      alert('Override failed');
    }
    setLoading(false);
  };

  const getSessionBookings = (sessionKey, date) => {
    return bookings.filter(b => b.session_key === sessionKey && b.date === date && b.type === 'class');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Dumbbell className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h1 className="text-3xl font-bold">Fitness Studio</h1>
            <p className="text-slate-400 mt-2">Live with Database</p>
          </div>
          <div className="space-y-4">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              placeholder="Email"
              disabled={loading}
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              placeholder="Password"
              disabled={loading}
            />
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="text-sm text-slate-400 mt-4">
              <p>Admin: admin@gym.com / admin123</p>
              <p>Member: jake@email.com / pass123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Fitness Studio {currentUser.is_admin ? 'Manager' : ''}</h1>
            <p className="text-blue-100">{currentUser.is_admin ? 'Admin Dashboard' : `Welcome, ${currentUser.name}`}</p>
          </div>
          <div className="text-right">
            {!currentUser.is_admin && (
              <div className="bg-blue-700 px-4 py-2 rounded-lg mb-2">
                <div className="text-sm text-blue-200">Account Balance</div>
                <div className="text-2xl font-bold">£{currentUser.credits.toFixed(2)}</div>
                <div className="text-xs text-blue-200 mt-1">
                  {Math.floor(currentUser.credits / 6)} classes (£6) • {Math.floor(currentUser.credits / 5)} gym (£5)
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="bg-slate-700 px-4 py-2 rounded flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {currentUser.is_admin ? (
          <>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'schedule' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                Class Schedule
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'members' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                Members
              </button>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-4 py-2 mb-6"
            />

            {activeTab === 'schedule' && (
              <div>
                {['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const daySessions = schedule.filter(s => s.day === day);
                  if (daySessions.length === 0) return null;
                  return (
                    <div key={day} className="bg-slate-800 p-6 rounded-lg mb-6">
                      <h3 className="text-xl font-bold mb-4 text-blue-400">{day}</h3>
                      {daySessions.map((session) => {
                        const sessionBookings = getSessionBookings(session.key, selectedDate);
                        const count = sessionBookings.length;
                        const overrideKey = `${session.key}-${selectedDate}`;
                        const isOverridden = classOverrides[overrideKey];
                        const isConfirmed = count >= 4 || isOverridden;
                        
                        return (
                          <div key={session.key} className="bg-slate-700 p-4 rounded-lg mb-3">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-semibold text-lg">{session.time}</div>
                                <div className="bg-blue-600 inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1">
                                  {session.type}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`${isConfirmed ? 'bg-green-600' : 'bg-red-600'} px-3 py-1 rounded-full text-sm font-semibold mb-2`}>
                                  {isConfirmed ? 'Running' : 'Cancelled'}
                                </div>
                                <div className="text-slate-400 text-sm">{count} / 4 minimum</div>
                              </div>
                            </div>

                            {count < 4 && (
                              <div className="bg-slate-800 p-3 rounded mb-3 flex items-center gap-2 text-amber-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Class needs {4 - count} more to run</span>
                                <button
                                  onClick={() => toggleOverride(session.key, selectedDate)}
                                  disabled={loading}
                                  className="ml-auto bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-white text-sm disabled:opacity-50"
                                >
                                  {isOverridden ? 'Remove Override' : 'Override & Run'}
                                </button>
                              </div>
                            )}

                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-slate-300 mb-2">
                                Bookings (£{count * 6} revenue):
                              </div>
                              {sessionBookings.map(booking => {
                                const member = members.find(m => m.id === booking.member_id);
                                return (
                                  <div key={booking.id} className="bg-slate-600 p-3 rounded flex justify-between items-center">
                                    <span className="font-medium">{member?.name}</span>
                                    <button
                                      onClick={() => removeBooking(booking.id)}
                                      disabled={loading}
                                      className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                              {count === 0 && <div className="text-slate-500 text-sm">No bookings yet</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                {members.filter(m => !m.is_admin).map(member => {
                  const memberBookings = bookings.filter(b => b.member_id === member.id);
                  const upcomingBookings = memberBookings.filter(b => b.date >= selectedDate);
                  return (
                    <div key={member.id} className="bg-slate-800 p-6 rounded-lg mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{member.name}</h3>
                          <div className="mt-2 text-slate-400 text-sm space-y-1">
                            <div>📧 {member.email}</div>
                            <div>📱 {member.phone}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-600 px-4 py-2 rounded-lg mb-2">
                            <div className="text-sm">Credits</div>
                            <div className="text-2xl font-bold">£{member.credits.toFixed(2)}</div>
                          </div>
                          <div className="text-sm text-slate-400">
                            <div>{upcomingBookings.length} upcoming</div>
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
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('book-classes')}
                className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'book-classes' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                Book Classes
              </button>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'my-bookings' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                My Bookings
              </button>
              <button onClick={() => setShowTopUp(true)} className="px-6 py-3 rounded-lg font-semibold bg-green-600 ml-auto">
                £ Top Up
              </button>
            </div>

            {activeTab === 'book-classes' && (
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-4 py-2 mb-6"
                />

                {['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const daySessions = schedule.filter(s => s.day === day);
                  if (daySessions.length === 0) return null;
                  return (
                    <div key={day} className="bg-slate-800 p-6 rounded-lg mb-6">
                      <h3 className="text-xl font-bold mb-4 text-blue-400">{day}</h3>
                      {daySessions.map((session) => {
                        const sessionBookings = getSessionBookings(session.key, selectedDate);
                        const count = sessionBookings.length;
                        const myBooking = sessionBookings.find(b => b.member_id === currentUser.id);
                        const overrideKey = `${session.key}-${selectedDate}`;
                        const isConfirmed = count >= 4 || classOverrides[overrideKey];
                        
                        return (
                          <div key={session.key} className="bg-slate-700 p-4 rounded-lg mb-3">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-slate-600">
                              <div>
                                <div className="font-bold text-xl">{session.time}</div>
                                <div className="bg-blue-600 inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1">
                                  {session.type}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="bg-slate-800 px-4 py-2 rounded-lg mb-2">
                                  <div className="text-white text-xl font-bold">{count} / 4</div>
                                  <div className="text-slate-400 text-xs">people</div>
                                </div>
                                {isConfirmed ? (
                                  <div className="bg-green-600 px-5 py-2 rounded-lg text-white text-sm font-bold">
                                    ✓ CONFIRMED
                                  </div>
                                ) : (
                                  <div className="bg-amber-500 px-5 py-2 rounded-lg text-white text-sm font-bold">
                                    ⏱ PENDING
                                  </div>
                                )}
                              </div>
                            </div>

                            {myBooking ? (
                              <div className={`${isConfirmed ? 'bg-green-600' : 'bg-amber-500'} p-4 rounded`}>
                                <div className="flex justify-between items-center">
                                  <div className="text-white font-bold">
                                    {isConfirmed ? '✓ Booked - Confirmed!' : '⏱ Booked - Pending'}
                                  </div>
                                  <button
                                    onClick={() => removeBooking(myBooking.id)}
                                    disabled={loading}
                                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {!isConfirmed && (
                                  <div className="text-white text-sm mt-2">
                                    Need {4 - count} more to confirm. Full refund if cancelled.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowBookSession(session)}
                                disabled={currentUser.credits < 6 || loading}
                                className={`w-full px-4 py-3 rounded-lg font-semibold ${
                                  currentUser.credits < 6 || loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {currentUser.credits < 6 ? 'Insufficient Credits' : 'Book Class (£6.00)'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'my-bookings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
                {bookings
                  .filter(b => b.member_id === currentUser.id && b.date >= selectedDate)
                  .map(booking => {
                    const session = schedule.find(s => s.key === booking.session_key);
                    const count = getSessionBookings(booking.session_key, booking.date).length;
                    const overrideKey = `${booking.session_key}-${booking.date}`;
                    const isConfirmed = count >= 4 || classOverrides[overrideKey];
                    return (
                      <div key={booking.id} className="bg-slate-800 p-4 rounded-lg mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{session?.day} {session?.time}</div>
                            <div className="text-slate-400 text-sm">{session?.type} - £6.00</div>
                            <div className="text-slate-500 text-sm">{new Date(booking.date).toLocaleDateString('en-GB')}</div>
                            {isConfirmed ? (
                              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block">
                                ✓ Confirmed
                              </div>
                            ) : (
                              <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block">
                                ⏱ Pending
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeBooking(booking.id)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {showBookSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Booking</h3>
              <div className="space-y-3 mb-6">
                <div>Class: {showBookSession.day} {showBookSession.time}</div>
                <div>Type: {showBookSession.type}</div>
                <div>Cost: £6.00</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={addBooking} 
                  disabled={loading}
                  className="flex-1 bg-blue-600 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Confirm'}
                </button>
                <button 
                  onClick={() => setShowBookSession(null)} 
                  disabled={loading}
                  className="flex-1 bg-slate-700 px-4 py-2 rounded-lg"
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
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => setTopUpAmount('30')} className="bg-slate-700 px-4 py-3 rounded-lg">
                  £30
                </button>
                <button onClick={() => setTopUpAmount('60')} className="bg-slate-700 px-4 py-3 rounded-lg">
                  £60
                </button>
                <button onClick={() => setTopUpAmount('120')} className="bg-slate-700 px-4 py-3 rounded-lg">
                  £120
                </button>
              </div>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mb-4"
                placeholder="Custom amount"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleTopUp} 
                  disabled={loading}
                  className="flex-1 bg-green-600 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Add Credits'}
                </button>
                <button 
                  onClick={() => setShowTopUp(false)} 
                  disabled={loading}
                  className="flex-1 bg-slate-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymCRM;

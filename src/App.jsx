import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Send,
  DollarSign,
  Bell,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const groups = {
  "1-Guruh": ["Abdulazizkhon", "Hasan", "Husan", "Javokhir", "Anvar"],
  "2-Guruh": ["Jakhongir", "Moxirbek"],
  "3-Guruh": ["MuhammadZiyo"],
};

const parentContacts = {
  "Abdulazizkhon": "7642751739",
  "Hasan": "987654321",
  "Husan": "555666777",
  "Javokhir": "111222333",
  "Anvar": "888999000",
  "Jakhongir": "7642751739",
  "Moxirbek": "777888999",
  "MuhammadZiyo": "333444555",
};

const months = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

function App() {
  const BOT_TOKEN = "8373188257:AAG1hlsm1EXqXE6aYjx0txn0Lmfmpyzlq2o";
  const CHAT_ID = "@jqtechss";

  const [selectedGroup, setSelectedGroup] = useState("1-Guruh");
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentDay, setCurrentDay] = useState(new Date().getDate());
  const [isSending, setIsSending] = useState(false);
  const [paymentDates, setPaymentDates] = useState({});
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month + 1, 0).getDate();
  };

  const getAvailableDays = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(currentMonth);
    const currentMonthIndex = today.getMonth();
    
    if (currentMonth === currentMonthIndex) {
      return today.getDate();
    } else if (currentMonth < currentMonthIndex) {
      return daysInMonth;
    }
    return 0;
  };

  useEffect(() => {
    const saved = localStorage.getItem("attendanceData");
    if (saved) {
      try {
        setAttendance(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading data:", e);
      }
    }

    const savedPayments = localStorage.getItem("paymentDates");
    if (savedPayments) {
      try {
        setPaymentDates(JSON.parse(savedPayments));
      } catch (e) {
        console.error("Error loading payment data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const maxDay = getAvailableDays();
    if (maxDay > 0) {
      setCurrentDay(Math.min(currentDay, maxDay));
    }
  }, [currentMonth]);

  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      localStorage.setItem("attendanceData", JSON.stringify(attendance));
    }
  }, [attendance]);

  useEffect(() => {
    if (Object.keys(paymentDates).length > 0) {
      localStorage.setItem("paymentDates", JSON.stringify(paymentDates));
    }
  }, [paymentDates]);

  useEffect(() => {
    setAnimateStats(true);
    const timer = setTimeout(() => setAnimateStats(false), 600);
    return () => clearTimeout(timer);
  }, [selectedGroup, currentMonth, currentDay]);

  const setPaymentDate = (student, day) => {
    setPaymentDates(prev => ({
      ...prev,
      [student]: day
    }));
  };

  const getPaymentStatus = (student) => {
    const today = new Date().getDate();
    const paymentDay = paymentDates[student];
    
    if (!paymentDay) return { status: "not-set", message: "To'lov sanasi belgilanmagan", color: "gray" };
    
    const daysUntil = paymentDay - today;
    
    if (daysUntil === 3) {
      return { status: "warning-3", message: `💰 3 kundan keyin`, color: "yellow" };
    } else if (daysUntil === 2) {
      return { status: "warning-2", message: `💰 2 kundan keyin`, color: "yellow" };
    } else if (daysUntil === 1) {
      return { status: "warning-1", message: `💰 Ertaga to'lov!`, color: "orange" };
    } else if (daysUntil === 0) {
      return { status: "today", message: `💰 Bugun to'lov!`, color: "blue" };
    } else if (daysUntil < 0) {
      return { status: "overdue", message: `⚠️ ${Math.abs(daysUntil)} kun kechikish`, color: "red" };
    } else {
      return { status: "ok", message: `✅ ${paymentDay}-${months[currentMonth]}`, color: "green" };
    }
  };

  const sendPaymentReminders = async () => {
    setIsSendingReminders(true);
    const students = groups[selectedGroup];
    let sentCount = 0;

    try {
      for (const student of students) {
        const parentId = parentContacts[student];
        if (!parentId) continue;

        const paymentStatus = getPaymentStatus(student);
        
        if (['warning-3', 'warning-2', 'warning-1', 'today', 'overdue'].includes(paymentStatus.status)) {
          const paymentDay = paymentDates[student];
          const today = new Date();
          
          let message = `
👋 Assalomu alaykum!

👤 O'quvchi: ${student}
📅 Bugungi sana: ${today.getDate()}-${months[currentMonth]}-${today.getFullYear()}
💳 To'lov sanasi: ${paymentDay}-${months[currentMonth]}

${paymentStatus.message}

${paymentStatus.status === 'overdue' ? '🔒 To\'lov amalga oshirilmagunga qadar darslar muzlatiladi.\n' : ''}
💰 To'lov summasini o'z vaqtida to'lashingizni so'raymiz.

📚 JQ Tech Tizim
📞 Aloqa: @jonibek_JI
          `.trim();

          await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: parentId,
                text: message,
                parse_mode: "HTML",
              }),
            }
          );
          
          sentCount++;
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      alert(`✅ ${sentCount} ta eslatma yuborildi!`);
    } catch (err) {
      console.error(err);
      alert("❌ Xatolik yuz berdi!");
    } finally {
      setIsSendingReminders(false);
    }
  };

  const sendTelegramSummary = async () => {
    const today = new Date();
    const date = `${currentDay}.${currentMonth + 1}.${today.getFullYear()}`;
    const dateKey = `${months[currentMonth]}-${currentDay}`;
    const monthData = attendance[dateKey] || {};
    const students = groups[selectedGroup];

    let presentList = [];
    let absentList = [];

    students.forEach((student) => {
      if (monthData[student]?.keldi) {
        presentList.push(student);
      } else if (monthData[student]?.kemadi) {
        absentList.push(student);
      }
    });

    const channelMessage = `
📊 DAVOMAT HISOBOTI
━━━━━━━━━━━━━━━━━━
📅 Sana: ${date}
👥 Guruh: ${selectedGroup}
📆 Oy: ${months[currentMonth]}
🗓 Kun: ${currentDay}

✅ KELGANLAR (${presentList.length}):
${presentList.length > 0 ? presentList.map((s) => `  • ${s}`).join("\n") : "  Hech kim kelmadi"}

❌ KELMAGANLAR (${absentList.length}):
${absentList.length > 0 ? absentList.map((s) => `  • ${s}`).join("\n") : "  Hammasi kelgan"}

📈 JAMI: ${students.length} ta o'quvchi
📊 Foiz: ${Math.round((presentList.length / students.length) * 100)}%
━━━━━━━━━━━━━━━━━━
    `.trim();

    setIsSending(true);
    try {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id:  selectedGroup === "1-Guruh" ? "@jqtechss3" :
  selectedGroup === "2-Guruh" ? "@jqtech1" :
  "@jqtechss22",
            text: channelMessage,
            parse_mode: "HTML",
          }),
        }
      );

      for (const student of students) {
        const parentId = parentContacts[student];
        if (!parentId) continue;

        const status = monthData[student]?.keldi ? "✅ KELDI" : 
                      monthData[student]?.kemadi ? "❌ KELMADI" : "❓ Belgilanmagan";
        
        const parentMessage = `
👋 Assalomu alaykum!

👤 O'quvchi: ${student}
📅 Sana: ${date}
📆 ${months[currentMonth]} oyining ${currentDay}-kuni

${status}

${monthData[student]?.keldi ? "✅ Farzandingiz bugun darsga keldi." : ""}
${monthData[student]?.kemadi ? "⚠️ Farzandingiz bugun darsga kelmadi." : ""}

📚 JQ Tech Center
        `.trim();

        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: parentId,
              text: parentMessage,
              parse_mode: "HTML",
            }),
          }
        );

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      alert("✅ Hisobotlar muvaffaqiyatli yuborildi!");
    } catch (err) {
      console.error(err);
      alert("❌ Xatolik yuz berdi!");
    } finally {
      setIsSending(false);
    }
  };

  const toggleAttendance = (month, day, student, type) => {
    const dateKey = `${month}-${day}`;
    setAttendance((prev) => {
      const dayData = prev[dateKey] || {};
      const studentData = dayData[student] || {
        keldi: false,
        kemadi: false,
      };

      const newData = {
        keldi: type === "keldi" ? !studentData.keldi : false,
        kemadi: type === "kemadi" ? !studentData.kemadi : false,
      };

      return {
        ...prev,
        [dateKey]: { ...dayData, [student]: newData },
      };
    });
  };

  const getStats = () => {
    const dateKey = `${months[currentMonth]}-${currentDay}`;
    const dayData = attendance[dateKey] || {};
    const students = groups[selectedGroup];
    let present = 0, absent = 0;

    students.forEach((student) => {
      if (dayData[student]?.keldi) present++;
      if (dayData[student]?.kemadi) absent++;
    });

    return { present, absent, total: students.length };
  };

  const getPaymentStats = () => {
    const students = groups[selectedGroup];
    let needReminder = 0;
    let overdue = 0;

    students.forEach(student => {
      const status = getPaymentStatus(student);
      if (['warning-3', 'warning-2', 'warning-1', 'today'].includes(status.status)) {
        needReminder++;
      }
      if (status.status === 'overdue') {
        overdue++;
      }
    });

    return { needReminder, overdue };
  };

  const stats = getStats();
  const paymentStats = getPaymentStats();

  const gradients = {
    "1-Guruh": "from-blue-500 to-purple-600",
    "2-Guruh": "from-emerald-500 to-teal-600",
    "3-Guruh": "from-orange-500 to-pink-600",
  };

  return (
    <div className="min-h-screen min-h-screen bg-[#121826] from-slate-900 via-purple-900 to-slate-900 ">
      {/* Header */}
      <div className={`bg-[#121826] ${gradients[selectedGroup]} backdrop-blur-xl border-b border-white/10 p-6 pb-8 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black bg-opacity-20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">JQ Tech</h1>
                <p className="text-white text-opacity-80 text-sm">LMS</p>
              </div>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-12 h-12 bg-black bg-opacity-20 backdrop-blur-xl rounded-2xl flex items-center justify-center"
            >
              {showMenu ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>

          {/* Group Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.keys(groups).map((group) => (
           <button
  key={group}
  onClick={() => {
    setSelectedGroup(group);
    setShowMenu(false);
  }}
  className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300
    ${
      selectedGroup === group
        ? `
          bg-white text-slate-900
          shadow-[0_10px_30px_rgba(255,255,255,0.15)]
          ring-1 ring-white/30
          scale-[1.04]
        `
        : `
          bg-white/5 text-white/80
          border border-white/10
          hover:bg-white/10
          hover:text-white
        `
    }
  `}
>
  {group}
</button>

            ))}
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" style={{background: "#00000082"}} onClick={() => setShowMenu(false)}>
          <div className="absolute top-24 right-4 bg-white rounded-3xl shadow-2xl p-2 w-64" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowPaymentPanel(false);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                !showPaymentPanel ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Davomat</span>
            </button>
            <button
              onClick={() => {
                setShowPaymentPanel(true);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all mt-2 ${
                showPaymentPanel ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">To'lovlar</span>
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-4">
        {showPaymentPanel ? (
          /* TO'LOV PANELI */
          <>
            {/* Payment Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                <Bell className="w-8 h-8 text-white mb-2" />
                <p className="text-white text-opacity-90 text-sm font-medium">Eslatma kerak</p>
                <p className="text-4xl font-bold text-white mt-1">{paymentStats.needReminder}</p>
              </div>
              
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                <AlertTriangle className="w-8 h-8 text-white mb-2" />
                <p className="text-white text-opacity-90 text-sm font-medium">Muddati o'tgan</p>
                <p className="text-4xl font-bold text-white mt-1">{paymentStats.overdue}</p>
              </div>
            </div>

            {/* Students Payment List */}
            <div className="space-y-3">
              {groups[selectedGroup].map((student, idx) => {
                const status = getPaymentStatus(student);
                const gradientColors = {
                  'gray': 'from-gray-100 to-gray-200',
                  'green': 'from-emerald-100 to-teal-200',
                  'yellow': 'from-yellow-100 to-amber-200',
                  'orange': 'from-orange-100 to-red-200',
                  'blue': 'from-blue-100 to-indigo-200',
                  'red': 'from-red-100 to-rose-200'
                };

                return (
              <div 
  key={student} 
  className="bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5
             border border-white/10
             shadow-[0_15px_30px_rgba(0,0,0,0.3)]
             transition hover:border-white/20"
  style={{ animationDelay: `${idx * 50}ms` }}
>
  {/* HEADER */}
  <div className="flex items-center gap-4 mb-3">
    <div className={`w-14 h-14 rounded-xl
                    bg-[#0B0F1A] border border-white/10
                    flex items-center justify-center text-white font-bold text-xl shadow-md`}>
      {student.charAt(0)}
    </div>
    <span className="font-semibold text-white text-lg">{student}</span>

    {/* STATUS BADGE */}
    <span
      className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold
        ${
          status.color === 'green'
            ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"
            : status.color === 'yellow'
            ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
            : status.color === 'orange'
            ? "bg-orange-400/10 text-orange-400 border border-orange-400/30"
            : status.color === 'blue'
            ? "bg-blue-400/10 text-blue-400 border border-blue-400/30"
            : status.color === 'red'
            ? "bg-rose-400/10 text-rose-400 border border-rose-400/30"
            : "bg-white/5 text-white/50 border border-white/10"
        }
      `}
    >
      {status.message}
    </span>
  </div>

  {/* PAYMENT SELECT */}
  <select
    value={paymentDates[student] || ""}
    onChange={(e) => setPaymentDate(student, Number(e.target.value))}
    className="w-full px-4 py-3 bg-[#1E2030] rounded-2xl font-semibold text-white/90 shadow-inner
               focus:outline-none focus:ring-4 focus:ring-purple-400/50 text-sm"
  >
    <option value="">📅 Sanani tanlang</option>
    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
      <option key={day} value={day}>{day}-kun</option>
    ))}
  </select>

  {/* MOBILE / ADDITIONAL STATUS */}
  <div className="mt-3 text-xs md:text-sm font-semibold text-white/70">
    {status.message}
  </div>
</div>

                );
              })}
            </div>

            {/* Send Reminders Button */}
            <button
              onClick={sendPaymentReminders}
              disabled={isSendingReminders || paymentStats.needReminder === 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              {isSendingReminders ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <Bell className="w-6 h-6" />
                  Eslatmalarni yuborish ({paymentStats.needReminder + paymentStats.overdue})
                </>
              )}
            </button>
          </>
        ) : (
          /* DAVOMAT PANELI */
          <>
            {/* Date Controls */}
           <div className="bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10">
  <div className="grid grid-cols-2 gap-4">
    
    {/* OY */}
    <div>
      <label className="block text-white/70 text-sm font-medium mb-2">
        Oy
      </label>
      <select
        className="w-full px-4 py-3 bg-[#0B0F1A] text-white rounded-xl font-semibold
                   border border-white/10
                   focus:outline-none focus:ring-2 focus:ring-purple-500/40
                   hover:border-white/20 transition"
        value={currentMonth}
        onChange={(e) => setCurrentMonth(Number(e.target.value))}
      >
        {months.map((m, idx) => {
          const today = new Date();
          const isFutureMonth = idx > today.getMonth();
          return (
            <option key={idx} value={idx} disabled={isFutureMonth}>
              {m}
            </option>
          );
        })}
      </select>
    </div>

    {/* KUN */}
    <div>
      <label className="block text-white/70 text-sm font-medium mb-2">
        Kun
      </label>
      <select
        className="w-full px-4 py-3 bg-[#0B0F1A] text-white rounded-xl font-semibold
                   border border-white/10
                   focus:outline-none focus:ring-2 focus:ring-purple-500/40
                   hover:border-white/20 transition"
        value={currentDay}
        onChange={(e) => setCurrentDay(Number(e.target.value))}
      >
        {Array.from({ length: getAvailableDays() }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
    </div>

  </div>
</div>

            {/* Stats Cards */}
     <div className="grid grid-cols-3 gap-4">
  
  {/* KELGAN */}
  <div
    className={`bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5
      border border-white/10
      shadow-[0_20px_40px_rgba(0,0,0,0.4)]
      transition
      ${animateStats ? "ring-1 ring-emerald-400/40" : ""}
    `}
  >
    <div className="flex items-center justify-between mb-3">
      <CheckCircle className="w-7 h-7 text-emerald-400" />
    </div>
    <p className="text-white/60 text-sm">Kelgan</p>
    <p className="text-3xl font-bold text-white">{stats.present}</p>
  </div>

  {/* KELMAGAN */}
  <div
    className={`bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5
      border border-white/10
      shadow-[0_20px_40px_rgba(0,0,0,0.4)]
      transition
      ${animateStats ? "ring-1 ring-rose-400/40" : ""}
    `}
  >
    <div className="flex items-center justify-between mb-3">
      <XCircle className="w-7 h-7 text-rose-400" />
    </div>
    <p className="text-white/60 text-sm">Kelmagan</p>
    <p className="text-3xl font-bold text-white">{stats.absent}</p>
  </div>

  {/* FOIZ */}
  <div
    className={`bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5
      border border-white/10
      shadow-[0_20px_40px_rgba(0,0,0,0.4)]
      transition
      ${animateStats ? "ring-1 ring-indigo-400/40" : ""}
    `}
  >
    <div className="flex items-center justify-between mb-3">
      <TrendingUp className="w-7 h-7 text-indigo-400" />
    </div>
    <p className="text-white/60 text-sm">Foiz</p>
    <p className="text-3xl font-bold text-white">
      {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
    </p>
  </div>

</div>


            {/* Student List */}
     <div className="space-y-4 pb-24">
  {groups[selectedGroup].map((student, idx) => {
    const dateKey = `${months[currentMonth]}-${currentDay}`;
    const studentData = attendance[dateKey]?.[student];

    return (
      <div
        key={student}
        className="bg-[#121826]/80 backdrop-blur-xl rounded-2xl p-5
                   border border-white/10
                   shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                   transition hover:border-white/20"
        style={{ animationDelay: `${idx * 40}ms` }}
      >
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-xl bg-[#0B0F1A]
                       border border-white/10
                       flex items-center justify-center
                       text-white font-bold text-lg"
          >
            {student.charAt(0)}
          </div>

          <span className="font-semibold text-white text-base">
            {student}
          </span>

          {/* STATUS BADGE */}
          <span
            className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold
              ${
                studentData?.keldi
                  ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"
                  : studentData?.kemadi
                  ? "bg-rose-400/10 text-rose-400 border border-rose-400/30"
                  : "bg-white/5 text-white/50 border border-white/10"
              }
            `}
          >
            {studentData?.keldi
              ? "Keldi"
              : studentData?.kemadi
              ? "Kelmadi"
              : "Kutilmoqda"}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() =>
              toggleAttendance(months[currentMonth], currentDay, student, "keldi")
            }
            className={`py-3 rounded-xl font-semibold transition-all
              ${
                studentData?.keldi
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/40"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }
            `}
          >
            ✅ Keldi
          </button>

          <button
            onClick={() =>
              toggleAttendance(months[currentMonth], currentDay, student, "kemadi")
            }
            className={`py-3 rounded-xl font-semibold transition-all
              ${
                studentData?.kemadi
                  ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/40"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }
            `}
          >
            ❌ Kelmadi
          </button>
        </div>
      </div>
    );
  })}
</div>


            {/* Fixed Send Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
              <button
                onClick={sendTelegramSummary}
                disabled={isSending}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                {isSending ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <div>
                      <div className="text-sm">Hisobotni Yuborish</div>
                      <div className="text-xs opacity-80">{groups[selectedGroup].length} ta ota-ona</div>
                    </div>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
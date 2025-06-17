import React, { useState, useEffect } from 'react';

// API設定
const API_URL = 'https://zw5imfeelcfhupz6ctfpzgnqem0hxvdj.lambda-url.ap-northeast-1.on.aws';

const App = () => {
  const [selectedMonth, setSelectedMonth] = useState('7');
  const [calendarData, setCalendarData] = useState({});
  const [expandedShows, setExpandedShows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});

  // ショー名を短縮形に変換
  const getShortShowName = (showCode) => {
    const shortNames = {
      'BBB': 'ビッグバンドビート～ア・スペシャルトリート～',
      'MMW': 'ミッキーのマジカルミュージックワールド', 
      'CMB': 'クラブマウスビート',
      'DTF': 'ドリームス・テイク・フライト'
    };
    return shortNames[showCode] || showCode;
  };

  // APIからマスターデータと空席情報を取得
  const fetchAndTransformData = async (month) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data for month: ${month}`);
      
      const response = await fetch(`${API_URL}?month=${month}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const apiData = await response.json();
      console.log('API Response:', apiData);
      
      // APIレスポンスからマスターデータを直接設定
      if (apiData.masterData) {
        setCalendarData(apiData.masterData);
      } else {
        setCalendarData({});
      }
      
      // サマリー情報を設定
      if (apiData.summary) {
        setSummary(apiData.summary);
      } else {
        setSummary({});
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setCalendarData({});
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndTransformData(selectedMonth);
  }, [selectedMonth]);

  const StatusIcon = ({ status, size = "lg" }) => {
    const sizeClasses = {
      sm: "text-sm",
      md: "text-lg", 
      lg: "text-xl"
    };
    
    if (status === 'available') {
      return <span className={`text-green-600 ${sizeClasses[size]}`}>⭕</span>;
    } else if (status === 'sold-out') {
      return <span className={`text-red-600 ${sizeClasses[size]}`}>❌</span>;
    }
    return <span className={`text-gray-500 ${sizeClasses[size]}`}>?</span>;
  };

  const toggleShowExpansion = (showKey) => {
    const newExpandedShows = new Set(expandedShows);
    if (newExpandedShows.has(showKey)) {
      newExpandedShows.delete(showKey);
    } else {
      newExpandedShows.add(showKey);
    }
    setExpandedShows(newExpandedShows);
  };

  const PerformanceItem = ({ performance }) => {
    return (
      <div className="flex items-center justify-between px-2 py-1 bg-white rounded border text-xs">
        <span className="font-medium text-gray-800">第{performance.round}回</span>
        <StatusIcon status={performance.status || 'unknown'} size="sm" />
      </div>
    );
  };

  const ShowCard = ({ show, date, showCode }) => {
    const showKey = `${date}-${showCode}`;
    const isExpanded = expandedShows.has(showKey);
    const shortName = getShortShowName(showCode);
    const showStatuses = show.performances?.map(p => p.status || 'unknown') || [];
    const overallStatus = showStatuses.includes('available')
      ? 'available'
      : showStatuses.every(s => s === 'sold-out') && showStatuses.length > 0
      ? 'sold-out'
      : 'unknown';
    return (
      <div className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => toggleShowExpansion(showKey)}
        >
          <span className="text-sm font-medium truncate flex-1 mr-1 text-gray-800">{shortName}</span>
          <div className="flex items-center space-x-1">
            <StatusIcon status={overallStatus} size="md" />
            <svg 
              className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-blue-100 bg-blue-50">
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-700 mb-1 truncate">{show.fullShowName}</h4>
              <div className="space-y-1">
                {show.performances && show.performances
                  .sort((a, b) => a.round - b.round)
                  .map((performance, index) => (
                    <PerformanceItem
                      key={`${performance.ticketId}-${index}`}
                      performance={performance}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DayCard = ({ date, shows }) => {
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-white shadow-sm mb-4">
        <div className="text-center text-base font-bold mb-3 text-gray-800">
          {date}日
        </div>
        <div className="space-y-2">
          {Object.entries(shows).map(([showCode, showData]) => (
            <ShowCard
              key={`${date}-${showCode}`}
              show={showData}
              date={date}
              showCode={showCode}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#d6f6fb' }}>
      <div className="max-w-3xl mx-auto py-6 px-2">
        <h1 className="text-xl font-bold text-center mb-6 rounded-lg" style={{ background: '#009fe8', color: 'white', padding: '0.75rem 0' }}>
          チケット販売状況確認ページ
        </h1>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-blue-300 rounded px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-800"
              disabled={loading}
            >
              <option value="7">7月</option>
              <option value="8">8月</option>
              <option value="9">9月</option>
            </select>
            {loading && (
              <span className="text-blue-600 text-xs">読込中...</span>
            )}
          </div>
          {summary && summary.totalTickets > 0 && (
            <div className="text-xs bg-white px-3 py-1 rounded border border-blue-200 text-gray-800">
              <span className="hidden sm:inline">総公演: {summary.totalTickets} | </span>
              <span className="text-green-600">空席: {summary.available}</span> | 
              <span className="text-red-600">完売: {summary.soldOut}</span>
              {summary.unknown > 0 && <span className="text-gray-500"> | 不明: {summary.unknown}</span>}
            </div>
          )}
        </div>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              <strong>エラー:</strong> {error}
            </p>
            <button
              onClick={() => fetchAndTransformData(selectedMonth)}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              再試行
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(calendarData)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([date, shows]) => (
              <DayCard key={`day-${date}`} date={date} shows={shows} />
            ))}
        </div>
        {Object.keys(calendarData).length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm lg:text-base">
              {selectedMonth}月の公演データがありません
            </p>
            <p className="text-gray-500 text-xs mt-1">
              APIからデータを取得中です...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';

// API設定
const API_URL = 'https://zw5imfeelcfhupz6ctfpzgnqem0hxvdj.lambda-url.ap-northeast-1.on.aws';

const App = () => {
  const [selectedMonth, setSelectedMonth] = useState('7');
  const [calendarData, setCalendarData] = useState({});
  const [expandedShows, setExpandedShows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPark, setSelectedPark] = useState('all'); // 'all', 'land', 'sea'
  const [selectedShow, setSelectedShow] = useState('all'); // 'all' or showCode

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
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setCalendarData({});
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
      return <span className={`text-blue-400 ${sizeClasses[size]}`}>○</span>;
    } else if (status === 'sold-out') {
      return <span className={`text-blue-400 ${sizeClasses[size]}`}>×</span>;
    } else if (status === 'pre-sale') {
      return <span className={`text-gray-400 ${sizeClasses[size]}`}>-</span>;
    }
    return <span className={`text-blue-400 ${sizeClasses[size]}`}>?</span>;
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
    
    // 全体状態の判定を更新
    let overallStatus;
    if (showStatuses.includes('pre-sale') && showStatuses.every(s => s === 'pre-sale' || s === 'unknown')) {
      overallStatus = 'pre-sale';
    } else if (showStatuses.includes('available')) {
      overallStatus = 'available';
    } else if (showStatuses.every(s => s === 'sold-out') && showStatuses.length > 0) {
      overallStatus = 'sold-out';
    } else {
      overallStatus = 'unknown';
    }

    // ビッグバンドビートだけ改行表示
    let displayShortName;
    if (shortName === 'ビッグバンドビート～ア・スペシャルトリート～') {
      displayShortName = <span>ビッグバンドビート<br />～ア・スペシャルトリート～</span>;
    } else {
      displayShortName = shortName;
    }

    return (
      <div className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => toggleShowExpansion(showKey)}
        >
          <div className="flex items-center w-full">
            <span className="text-xs font-medium flex-1 mr-1 text-gray-800">{displayShortName}</span>
            <StatusIcon status={overallStatus} size="md" />
            <svg 
              className={`w-3 h-3 text-gray-500 transition-transform ml-1 ${isExpanded ? 'rotate-180' : ''}`}
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

  // ショーのパーク分類
  const parkMap = {
    'BBB': 'sea',
    'DTF': 'sea',
    'CMB': 'land',
    'MMW': 'land',
  };

  // 全ショーリスト
  const allShowFilterOptions = [
    { code: 'all', name: 'すべてのショー' },
    { code: 'CMB', name: 'クラブマウスビート', park: 'land' },
    { code: 'MMW', name: 'ミッキーのマジカルミュージックワールド', park: 'land' },
    { code: 'BBB', name: 'ビッグバンドビート～ア・スペシャルトリート～', park: 'sea' },
    { code: 'DTF', name: 'ドリームス・テイク・フライト', park: 'sea' },
  ];

  // パークに応じたショーフィルターリスト
  const showFilterOptions = selectedPark === 'all'
    ? allShowFilterOptions
    : allShowFilterOptions.filter(opt => opt.code === 'all' || opt.park === selectedPark);

  // パーク切り替え時に選択中ショーが対象外ならリセット
  useEffect(() => {
    if (selectedShow !== 'all' && !showFilterOptions.some(opt => opt.code === selectedShow)) {
      setSelectedShow('all');
    }
    // eslint-disable-next-line
  }, [selectedPark]);

  // 月リスト
  const months = [
    { value: '7', label: '7月' },
    { value: '8', label: '8月' },
    { value: '9', label: '9月' },
  ];
  const year = 2025;

  // パークタブ用
  const parkTabs = [
    { value: 'land', label: '東京ディズニーランド' },
    { value: 'sea', label: '東京ディズニーシー' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#d6f6fb' }}>
      <div className="max-w-4xl mx-auto py-6 px-2">
        {/* 月選択 */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1 pl-2">{year}年</div>
          <div className="flex gap-4 border-b border-gray-300 pb-2">
            {months.map(m => (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className={`px-3 py-1 rounded-full text-base font-medium focus:outline-none transition-all
                  ${selectedMonth === m.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {/* パークタブ */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
            {parkTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSelectedPark(tab.value)}
                className={`px-6 py-2 text-sm font-medium focus:outline-none transition-all
                  ${selectedPark === tab.value ? 'bg-pink-500 text-white' : 'bg-white text-gray-700'}`}
                style={{ borderRight: tab.value === 'land' ? '1px solid #ddd' : undefined }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* ショーセレクト */}
        {/* <div className="mb-6 flex justify-center">
          <select
            value={selectedShow}
            onChange={e => setSelectedShow(e.target.value)}
            className="border border-blue-300 rounded px-3 py-2 text-sm text-gray-800 min-w-[200px]"
          >
            {showFilterOptions.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.name}</option>
            ))}
          </select>
        </div> */}
      

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 gap-y-1">
          {Object.entries(calendarData)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([date, shows]) => {
              // フィルター適用
              const filteredShows = Object.entries(shows).filter(([showCode]) => {
                if (selectedPark !== 'all' && parkMap[showCode] !== selectedPark) return false;
                if (selectedShow !== 'all' && showCode !== selectedShow) return false;
                return true;
              });
              if (filteredShows.length === 0) return null;
              return (
                <DayCard key={`day-${date}`} date={date} shows={Object.fromEntries(filteredShows)} />
              );
            })}
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
                {/* ステータス凡例を追加 */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-700">
            <div className="flex items-center gap-1">
              <span className="text-blue-400 text-lg">○</span>
              <span>空席あり</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400 text-lg">×</span>
              <span>満席</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-lg">-</span>
              <span>販売前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
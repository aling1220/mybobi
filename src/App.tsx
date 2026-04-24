/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RotateCcw, 
  Hand, 
  MessageSquare, 
  ChevronRight, 
  Volume2, 
  VolumeX,
  History
} from 'lucide-react';
import { FORTUNE_STICKS, FortuneStick } from './constants';
import { interpretFortune } from './services/geminiService';

// Audio URLs (Publicly available or placeholders)
const SOUNDS = {
  SHAKE: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Bamboo/wood sound
  BLOCKS: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Wood hit
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Bell/Chime
};

type AppState = 'IDLE' | 'INPUT' | 'SHAKING' | 'STICK_DRAWN' | 'THROWING_BLOCKS' | 'RESULT';
type BlockResult = 'DIVINE' | 'LAUGH' | 'ANGRY' | null; // 聖筊, 笑筊, 怒筊

const CATEGORIES = ['整體運勢', '感情婚姻', '事業功名', '財運利祿', '健康平安', '學業考試'];

export default function App() {
  const [state, setState] = useState<AppState>('IDLE');
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [currentStick, setCurrentStick] = useState<FortuneStick | null>(null);
  const [blockResult, setBlockResult] = useState<BlockResult>(null);
  const [interpretation, setInterpretation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<{ stick: FortuneStick; interpretation: string; date: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (url: string) => {
    if (isMuted) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const startRitual = () => {
    if (!question.trim()) {
      alert('請先輸入您想請示的問題');
      return;
    }
    setState('SHAKING');
    playSound(SOUNDS.SHAKE);
    
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * FORTUNE_STICKS.length);
      setCurrentStick(FORTUNE_STICKS[randomIdx]);
      setState('STICK_DRAWN');
    }, 2000);
  };

  const throwBlocks = () => {
    setState('THROWING_BLOCKS');
    playSound(SOUNDS.BLOCKS);

    setTimeout(() => {
      const rand = Math.random();
      let result: BlockResult;
      if (rand < 0.5) {
        result = 'DIVINE'; // 聖筊 (50%)
        playSound(SOUNDS.SUCCESS);
      } else if (rand < 0.75) {
        result = 'LAUGH'; // 笑筊 (25%)
      } else {
        result = 'ANGRY'; // 怒筊 (25%)
      }
      setBlockResult(result);

      if (result === 'DIVINE') {
        fetchInterpretation();
      } else {
        // Wait a bit then let user retry or reshake
        setTimeout(() => {
          if (result === 'LAUGH' || result === 'ANGRY') {
            // User needs to reshake or re-throw? 
            // Traditionally, if not Divine, you might need to reshake or just re-throw.
            // Let's say if it's not Divine, you go back to SHAKING to "re-ask"
            // setState('SHAKING'); // Or let them click a button
          }
        }, 2000);
      }
    }, 1500);
  };

  const fetchInterpretation = async () => {
    if (!currentStick) return;
    setIsLoading(true);
    try {
      const result = await interpretFortune(currentStick, question, category);
      setInterpretation(result);
      setHistory(prev => [{ stick: currentStick, interpretation: result, date: new Date().toLocaleString() }, ...prev]);
      setState('RESULT');
    } catch (error) {
      console.error("Interpretation Error:", error);
      setInterpretation("大師目前感應中斷，請確認 API 金鑰是否設定正確。");
      setState('RESULT');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setState('IDLE');
    setQuestion('');
    setCurrentStick(null);
    setBlockResult(null);
    setInterpretation('');
  };

  return (
    <div className="min-h-screen bg-[#1a0f0f] text-[#f5e6d3] font-serif selection:bg-[#d4af37] selection:text-[#1a0f0f] overflow-x-hidden">
      {/* Background Texture/Overlay */}
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b border-[#d4af37]/20 bg-[#1a0f0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <Sparkles className="text-[#1a0f0f] w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-[#d4af37]">靈感宮</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-[#d4af37]/10 rounded-full transition-colors"
            title="求籤紀錄"
          >
            <History className="w-6 h-6 text-[#d4af37]" />
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-[#d4af37]/10 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-[#d4af37]" /> : <Volume2 className="w-6 h-6 text-[#d4af37]" />}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto p-6 pt-12">
        <AnimatePresence mode="wait">
          {state === 'IDLE' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ rotate: [0, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-48 h-48 mx-auto bg-[#8b0000] rounded-2xl border-4 border-[#d4af37] flex items-center justify-center shadow-2xl"
                >
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3247/3247310.png" 
                    alt="Temple" 
                    className="w-32 h-32 opacity-80 invert"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="absolute -bottom-4 -right-4 bg-[#d4af37] text-[#1a0f0f] px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  誠心則靈
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-[#d4af37]">恭迎大駕</h2>
                <p className="text-[#f5e6d3]/70 leading-relaxed">
                  靜心凝神，將您心中的疑惑或祈求之事告知神明。<br/>
                  本宮將為您指引迷津。
                </p>
              </div>

              <button 
                onClick={() => setState('INPUT')}
                className="group relative px-12 py-4 bg-[#d4af37] text-[#1a0f0f] font-bold text-xl rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                <span className="relative z-10">開始求籤</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </motion.div>
          )}

          {state === 'INPUT' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a1a1a] p-8 rounded-3xl border border-[#d4af37]/30 shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-4">請示事項</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#d4af37] mb-2">選擇類別</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                          category === cat 
                          ? 'bg-[#d4af37] text-[#1a0f0f] border-[#d4af37]' 
                          : 'bg-transparent text-[#f5e6d3]/60 border-[#d4af37]/30 hover:border-[#d4af37]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#d4af37] mb-2">具體問題 (選填)</label>
                  <textarea 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="例如：最近想換工作，請問未來三個月的事業運勢如何？"
                    className="w-full h-32 bg-[#1a0f0f] border border-[#d4af37]/30 rounded-xl p-4 text-[#f5e6d3] focus:outline-none focus:border-[#d4af37] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setState('IDLE')}
                  className="flex-1 py-4 border border-[#d4af37]/30 rounded-full hover:bg-[#d4af37]/10 transition-colors"
                >
                  返回
                </button>
                <button 
                  onClick={startRitual}
                  className="flex-[2] py-4 bg-[#d4af37] text-[#1a0f0f] font-bold rounded-full hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                >
                  誠心求籤
                </button>
              </div>
            </motion.div>
          )}

          {state === 'SHAKING' && (
            <motion.div 
              key="shaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-12"
            >
              <motion.div 
                animate={{ 
                  rotate: [-10, 10, -10],
                  y: [0, -20, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.3,
                  ease: "linear"
                }}
                className="relative w-40 h-64 mx-auto"
              >
                {/* Bamboo Cylinder SVG */}
                <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                  <path d="M10,20 L90,20 L85,150 L15,150 Z" fill="#5d4037" stroke="#d4af37" strokeWidth="2" />
                  <rect x="15" y="10" width="5" height="40" fill="#d4af37" transform="rotate(-15 15 10)" />
                  <rect x="30" y="5" width="5" height="45" fill="#d4af37" transform="rotate(-5 30 5)" />
                  <rect x="50" y="0" width="5" height="50" fill="#d4af37" />
                  <rect x="70" y="5" width="5" height="45" fill="#d4af37" transform="rotate(5 70 5)" />
                  <rect x="85" y="10" width="5" height="40" fill="#d4af37" transform="rotate(15 85 10)" />
                  <path d="M10,40 Q50,30 90,40" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
                </svg>
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#d4af37] animate-pulse">感應中...</h3>
                <p className="text-[#f5e6d3]/60 italic">請在心中默念您的問題</p>
              </div>
            </motion.div>
          )}

          {state === 'STICK_DRAWN' && currentStick && (
            <motion.div 
              key="stick"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="bg-[#2a1a1a] p-12 rounded-2xl border-2 border-[#d4af37] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#d4af37]"></div>
                <h4 className="text-sm tracking-[0.5em] text-[#d4af37] mb-6 uppercase">抽得籤詩</h4>
                <div className="text-6xl font-bold text-[#d4af37] mb-8 [writing-mode:vertical-rl] mx-auto h-48">
                  {currentStick.title}
                </div>
                <p className="text-[#f5e6d3]/80 italic mb-8">「此籤是否為神明旨意，請擲筊確認」</p>
                
                <button 
                  onClick={throwBlocks}
                  className="w-full py-4 bg-[#8b0000] text-white font-bold rounded-xl border border-[#d4af37]/50 hover:bg-[#a00000] transition-colors flex items-center justify-center gap-3"
                >
                  <Hand className="w-6 h-6" />
                  擲筊確認 (需聖筊)
                </button>
              </div>
            </motion.div>
          )}

          {state === 'THROWING_BLOCKS' && (
            <motion.div 
              key="throwing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-12"
            >
              <div className="flex justify-center gap-8">
                <motion.div 
                  animate={{ 
                    rotate: [0, 720],
                    x: [-100, 0],
                    y: [-200, 0],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="w-24 h-12 bg-[#8b0000] rounded-full border-2 border-[#d4af37]"
                />
                <motion.div 
                  animate={{ 
                    rotate: [0, -720],
                    x: [100, 0],
                    y: [-200, 0],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="w-24 h-12 bg-[#8b0000] rounded-full border-2 border-[#d4af37]"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#d4af37]">擲筊中...</h3>
            </motion.div>
          )}

          {(blockResult && (state === 'STICK_DRAWN' || state === 'RESULT' || state === 'THROWING_BLOCKS')) && (
            <motion.div 
              key="block-result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            >
              <div className="bg-[#2a1a1a] p-8 rounded-3xl border-2 border-[#d4af37] max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="flex justify-center gap-4">
                  {blockResult === 'DIVINE' && (
                    <>
                      <div className="w-20 h-10 bg-[#8b0000] rounded-t-full border-2 border-[#d4af37]" />
                      <div className="w-20 h-10 bg-[#8b0000] rounded-b-full border-2 border-[#d4af37]" />
                    </>
                  )}
                  {blockResult === 'LAUGH' && (
                    <>
                      <div className="w-20 h-10 bg-[#8b0000] rounded-b-full border-2 border-[#d4af37]" />
                      <div className="w-20 h-10 bg-[#8b0000] rounded-b-full border-2 border-[#d4af37]" />
                    </>
                  )}
                  {blockResult === 'ANGRY' && (
                    <>
                      <div className="w-20 h-10 bg-[#8b0000] rounded-t-full border-2 border-[#d4af37]" />
                      <div className="w-20 h-10 bg-[#8b0000] rounded-t-full border-2 border-[#d4af37]" />
                    </>
                  )}
                </div>

                <h3 className={`text-4xl font-bold ${blockResult === 'DIVINE' ? 'text-green-500' : 'text-red-500'}`}>
                  {blockResult === 'DIVINE' && '聖筊'}
                  {blockResult === 'LAUGH' && '笑筊'}
                  {blockResult === 'ANGRY' && '怒筊'}
                </h3>

                <p className="text-[#f5e6d3]/80">
                  {blockResult === 'DIVINE' && '神明已確認此籤，正在為您解惑...'}
                  {blockResult === 'LAUGH' && '神明笑而不語，或您問得不夠清楚，請重新求籤。'}
                  {blockResult === 'ANGRY' && '神明不認同此籤，或時機未到，請重新求籤。'}
                </p>

                {blockResult === 'DIVINE' ? (
                  isLoading ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#d4af37]/60">大師正在感應籤詩...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setBlockResult(null);
                        setState('RESULT');
                      }}
                      className="w-full py-4 bg-[#d4af37] text-[#1a0f0f] font-bold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                    >
                      查看大師解籤
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => {
                      setBlockResult(null);
                      setState('SHAKING');
                      playSound(SOUNDS.SHAKE);
                      setTimeout(() => {
                        const randomIdx = Math.floor(Math.random() * FORTUNE_STICKS.length);
                        setCurrentStick(FORTUNE_STICKS[randomIdx]);
                        setState('STICK_DRAWN');
                      }, 2000);
                    }}
                    className="w-full py-3 bg-[#d4af37] text-[#1a0f0f] font-bold rounded-xl"
                  >
                    重新求籤
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {state === 'RESULT' && currentStick && interpretation && (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 pb-20"
            >
              <div className="bg-[#2a1a1a] p-8 rounded-3xl border border-[#d4af37]/30 shadow-2xl space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-block px-4 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[#d4af37] text-sm">
                    {category}
                  </div>
                  <h2 className="text-3xl font-bold text-[#d4af37]">{currentStick.title}</h2>
                </div>

                <div className="bg-[#1a0f0f] p-6 rounded-2xl border border-[#d4af37]/10 relative">
                  <div className="absolute -top-3 left-6 px-2 bg-[#2a1a1a] text-xs text-[#d4af37]/60">籤詩原文</div>
                  <p className="text-2xl text-center leading-loose tracking-widest text-[#f5e6d3] font-bold">
                    {currentStick.poem.split('，').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}{i === 0 ? '，' : ''}<br/>
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-bold">大師解籤</h3>
                  </div>
                  <div className="prose prose-invert max-w-none text-[#f5e6d3]/90 leading-relaxed whitespace-pre-wrap">
                    {interpretation}
                  </div>
                </div>

                <button 
                  onClick={reset}
                  className="w-full py-4 bg-[#d4af37] text-[#1a0f0f] font-bold rounded-full hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  再次請示
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex justify-end"
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#1a0f0f] h-full border-l border-[#d4af37]/20 p-6 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#d4af37]">求籤紀錄</h3>
                <button onClick={() => setShowHistory(false)} className="text-[#f5e6d3]/60 hover:text-[#f5e6d3]">關閉</button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 text-[#f5e6d3]/40">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>尚無求籤紀錄</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map((item, idx) => (
                    <div key={idx} className="bg-[#2a1a1a] p-4 rounded-xl border border-[#d4af37]/10 space-y-2">
                      <div className="flex justify-between text-xs text-[#d4af37]/60">
                        <span>{item.date}</span>
                        <span>{item.stick.title}</span>
                      </div>
                      <p className="text-sm line-clamp-2 text-[#f5e6d3]/80">{item.interpretation}</p>
                      <button 
                        onClick={() => {
                          setCurrentStick(item.stick);
                          setInterpretation(item.interpretation);
                          setState('RESULT');
                          setShowHistory(false);
                        }}
                        className="text-xs text-[#d4af37] flex items-center gap-1 hover:underline"
                      >
                        查看詳情 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decoration */}
      <footer className="fixed bottom-0 left-0 w-full p-4 text-center text-[10px] text-[#d4af37]/30 tracking-widest pointer-events-none">
        © 2024 靈感宮 數位求籤系統 · 誠心祈禱 必有迴響
      </footer>
    </div>
  );
}

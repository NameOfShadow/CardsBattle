import React, { useState, useRef } from 'react';
import { Upload, Download, Plus, RotateCcw, Play, ArrowLeft, ArrowRight, Check, X, Image } from 'lucide-react';
import "./index.css";

const App = () => {
  const [screen, setScreen] = useState('start');
  const [deck, setDeck] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [correctPile, setCorrectPile] = useState([]);
  const [repeatPile, setRepeatPile] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotateAngle, setRotateAngle] = useState(0);
  
  // Editor states
  const [newCard, setNewCard] = useState({
    image: '',
    question: '',
    category: ''
  });
  const [previewCards, setPreviewCards] = useState([]);
  const [cardBack, setCardBack] = useState('');
  const [tableTexture, setTableTexture] = useState('');
  
  const fileInputRef = useRef(null);
  const cardBackInputRef = useRef(null);
  const tableTextureInputRef = useRef(null);
  const cardRef = useRef(null);

  // Функция для перемешивания карт
  const shuffleDeck = (cards) => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Загрузка рубашки карты
  const handleCardBackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardBack(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Загрузка текстуры стола
  const handleTableTextureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTableTexture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Editor functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCard({...newCard, image: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const addCard = () => {
    if (newCard.question && newCard.category) {
      setPreviewCards([...previewCards, {...newCard, id: Date.now()}]);
      setNewCard({image: '', question: '', category: ''});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveDeck = () => {
    if (previewCards.length > 0) {
      const shuffledDeck = shuffleDeck(previewCards);
      setDeck(shuffledDeck);
      setScreen('game');
      setCardIndex(0);
      setCorrectPile([]);
      setRepeatPile([]);
    }
  };

  const importDeck = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const imported = JSON.parse(reader.result);
          const shuffledDeck = shuffleDeck(imported);
          setDeck(shuffledDeck);
          setScreen('game');
          setCardIndex(0);
          setCorrectPile([]);
          setRepeatPile([]);
        } catch (err) {
          alert('Ошибка импорта файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportDeck = () => {
    const dataStr = JSON.stringify(previewCards, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deck.json';
    link.click();
  };

  // Game functions
  const drawCard = () => {
    if (cardIndex < deck.length) {
      setCurrentCard(deck[cardIndex]);
    }
  };

  const handleSwipe = (direction) => {
    if (!currentCard) return;
    
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === 'right') {
        setCorrectPile([...correctPile, currentCard]);
      } else {
        setRepeatPile([...repeatPile, currentCard]);
      }
      
      setCurrentCard(null);
      setSwipeDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setRotateAngle(0);
      
      if (cardIndex + 1 >= deck.length) {
        setTimeout(() => setScreen('results'), 300);
      } else {
        setCardIndex(cardIndex + 1);
      }
    }, 400);
  };

  // Swipe handlers
  const handleDragStart = (e) => {
    if (!currentCard) return;
    setIsDragging(true);
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      startX: clientX,
      startY: clientY,
      x: 0,
      y: 0
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging || !currentCard) return;
    
    e.preventDefault();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragOffset.startX;
    const deltaY = clientY - dragOffset.startY;
    
    setDragOffset({
      ...dragOffset,
      x: deltaX,
      y: deltaY
    });
    
    // Calculate rotation based on horizontal movement
    const newRotate = deltaX * 0.1;
    setRotateAngle(newRotate);
  };

  const handleDragEnd = () => {
    if (!isDragging || !currentCard) return;
    
    setIsDragging(false);
    const swipeThreshold = 100;
    
    if (Math.abs(dragOffset.x) > swipeThreshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      handleSwipe(direction);
    } else {
      // Reset position if swipe wasn't far enough
      setDragOffset({ x: 0, y: 0 });
      setRotateAngle(0);
    }
  };

  // Calculate color based on drag direction and distance
  const getCardColor = () => {
    if (!isDragging || dragOffset.x === 0) return '';
    
    const swipeThreshold = 100;
    const progress = Math.min(Math.abs(dragOffset.x) / swipeThreshold, 1);
    
    if (dragOffset.x > 0) {
      // Swiping right - green color
      return `rgba(34, 197, 94, ${progress * 0.4})`;
    } else {
      // Swiping left - red color
      return `rgba(239, 68, 68, ${progress * 0.4})`;
    }
  };

  const restartGame = () => {
    const shuffledDeck = shuffleDeck(deck);
    setDeck(shuffledDeck);
    setCardIndex(0);
    setCorrectPile([]);
    setRepeatPile([]);
    setCurrentCard(null);
    setScreen('game');
  };

  const repeatErrors = () => {
    if (repeatPile.length > 0) {
      const shuffledRepeatPile = shuffleDeck(repeatPile);
      setDeck(shuffledRepeatPile);
      setCardIndex(0);
      setCorrectPile([]);
      setRepeatPile([]);
      setCurrentCard(null);
      setScreen('game');
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = correctPile.length + repeatPile.length;
    const correct = correctPile.length;
    const categories = {};
    
    correctPile.forEach(card => {
      categories[card.category] = (categories[card.category] || 0) + 1;
    });
    
    const strongSides = Object.keys(categories).filter(cat => 
      categories[cat] / correctPile.filter(c => c.category === cat).length > 0.5
    );
    
    return { total, correct, strongSides };
  };

  // Render Start Screen
  if (screen === 'start') {
    return (
      <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Modern minimalist background */}
        <div className="absolute inset-0 bg-neutral-900"></div>
        <div className="absolute inset-0 bg-[linear-gradient(30deg,_rgba(255,255,255,0.02)_0%,_transparent_50%)]"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        <div className="relative z-10 text-center space-y-16 max-w-2xl mx-auto w-full">
          <div className="space-y-8">
            <div className="inline-block">
              <h1 className="text-5xl font-light text-white mb-6 tracking-wide">
                CARDS <span className="font-semibold">BATTLE</span>
              </h1>
              <div className="h-px w-32 mx-auto bg-neutral-700 mb-2"></div>
              <div className="h-px w-24 mx-auto bg-neutral-800"></div>
            </div>
            <p className="text-lg text-neutral-400 font-light max-w-md mx-auto leading-relaxed">
              Минималистичная платформа для эффективного обучения
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-3 w-full max-w-sm mx-auto">
            <button
              onClick={() => setScreen('editor')}
              className="group relative w-full bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden border border-neutral-700 hover:border-neutral-600"
            >
              <Plus size={20} className="text-neutral-300" />
              <span>Создать колоду</span>
            </button>
            
            <label className="group relative w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white px-8 py-4 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer overflow-hidden">
              <Upload size={20} className="text-neutral-300" />
              <span>Импорт колоды</span>
              <input
                type="file"
                accept=".json"
                onChange={importDeck}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Render Editor Screen
  if (screen === 'editor') {
    return (
      <div className="min-h-screen bg-neutral-950 relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-neutral-900"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <button
                onClick={() => setScreen('start')}
                className="bg-neutral-800 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition border border-neutral-700 flex items-center gap-2 mb-4 text-sm"
              >
                <ArrowLeft size={16} />
                Назад
              </button>
              <h2 className="text-2xl font-light text-white">Конструктор колоды</h2>
              <p className="text-neutral-400 mt-1 text-sm">Создайте структурированные карточки для обучения</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-6">
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center">
                    <Plus size={16} className="text-neutral-300" />
                  </div>
                  Новая карточка
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-300 mb-2 text-sm font-normal">Изображение</label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload"
                        className="block w-full bg-neutral-700/50 border border-dashed border-neutral-600 hover:border-neutral-500 rounded-lg p-6 transition cursor-pointer group"
                      >
                        {newCard.image ? (
                          <img src={newCard.image} alt="Preview" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <div className="text-center">
                            <Upload size={20} className="mx-auto text-neutral-500 group-hover:text-neutral-400 transition mb-2" />
                            <p className="text-neutral-400 group-hover:text-neutral-300 transition text-sm">Загрузите изображение</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-neutral-300 mb-2 text-sm font-normal">Вопрос</label>
                    <textarea
                      value={newCard.question}
                      onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                      className="w-full bg-neutral-700/50 text-white rounded-lg p-3 h-24 placeholder-neutral-500 border border-neutral-600 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/10 transition outline-none resize-none text-sm"
                      placeholder="Введите учебный вопрос..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-neutral-300 mb-2 text-sm font-normal">Категория</label>
                    <input
                      value={newCard.category}
                      onChange={(e) => setNewCard({...newCard, category: e.target.value})}
                      className="w-full bg-neutral-700/50 text-white rounded-lg p-3 placeholder-neutral-500 border border-neutral-600 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/10 transition outline-none text-sm"
                      placeholder="Например: Математика, Программирование..."
                    />
                  </div>
                  
                  <button
                    onClick={addCard}
                    className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm border border-neutral-600"
                  >
                    <Plus size={16} />
                    Добавить карточку
                  </button>
                </div>
              </div>

              {/* Card Back Design */}
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center">
                    <Image size={16} className="text-neutral-300" />
                  </div>
                  Дизайн рубашки
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-300 mb-2 text-sm font-normal">Рубашка карты</label>
                    <div className="relative">
                      <input
                        ref={cardBackInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCardBackUpload}
                        className="hidden"
                        id="cardback-upload"
                      />
                      <label 
                        htmlFor="cardback-upload"
                        className="block w-full bg-neutral-700/50 border border-dashed border-neutral-600 hover:border-neutral-500 rounded-lg p-6 transition cursor-pointer group"
                      >
                        {cardBack ? (
                          <img src={cardBack} alt="Card Back" className="w-full h-32 object-contain rounded" />
                        ) : (
                          <div className="text-center">
                            <Image size={20} className="mx-auto text-neutral-500 group-hover:text-neutral-400 transition mb-2" />
                            <p className="text-neutral-400 group-hover:text-neutral-300 transition text-sm">Загрузите PNG рубашку</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  {cardBack && (
                    <button
                      onClick={() => setCardBack('')}
                      className="w-full bg-neutral-700/50 text-white px-4 py-2 rounded-lg hover:bg-neutral-600/50 transition text-sm border border-neutral-600 flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Удалить рубашку
                    </button>
                  )}
                  
                  <div className="bg-neutral-700/30 rounded-lg p-4">
                    <h4 className="text-neutral-300 text-sm font-normal mb-2">Предпросмотр рубашки</h4>
                    <div className="flex justify-center">
                      <div className="w-36 h-48 bg-neutral-700 rounded-lg border border-neutral-600 flex items-center justify-center overflow-hidden">
                        {cardBack ? (
                          <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                            <img src={cardBack} alt="Card Back" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="text-neutral-500 text-2xl">🎴</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Texture */}
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center">
                    <Image size={16} className="text-neutral-300" />
                  </div>
                  Текстура стола
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-300 mb-2 text-sm font-normal">Текстура игрового стола</label>
                    <div className="relative">
                      <input
                        ref={tableTextureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleTableTextureUpload}
                        className="hidden"
                        id="tabletexture-upload"
                      />
                      <label 
                        htmlFor="tabletexture-upload"
                        className="block w-full bg-neutral-700/50 border border-dashed border-neutral-600 hover:border-neutral-500 rounded-lg p-6 transition cursor-pointer group"
                      >
                        {tableTexture ? (
                          <img src={tableTexture} alt="Table Texture" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <div className="text-center">
                            <Image size={20} className="mx-auto text-neutral-500 group-hover:text-neutral-400 transition mb-2" />
                            <p className="text-neutral-400 group-hover:text-neutral-300 transition text-sm">Загрузите текстуру стола</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  {tableTexture && (
                    <button
                      onClick={() => setTableTexture('')}
                      className="w-full bg-neutral-700/50 text-white px-4 py-2 rounded-lg hover:bg-neutral-600/50 transition text-sm border border-neutral-600 flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Удалить текстуру
                    </button>
                  )}
                  
                  <div className="bg-neutral-700/30 rounded-lg p-4">
                    <h4 className="text-neutral-300 text-sm font-normal mb-2">Предпросмотр стола</h4>
                    <div className="h-20 rounded border border-neutral-600 overflow-hidden">
                      {tableTexture ? (
                        <div 
                          className="w-full h-full"
                          style={{ backgroundImage: `url(${tableTexture})`, backgroundSize: 'cover' }}
                        ></div>
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <p className="text-neutral-500 text-xs">Стандартный фон</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Preview */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 h-fit">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center text-sm text-neutral-300">
                    {previewCards.length}
                  </div>
                  Колода
                </h3>
                <div className="flex gap-2">
                  {previewCards.length > 0 && (
                    <>
                      <button
                        onClick={exportDeck}
                        className="bg-neutral-700 text-white px-3 py-2 rounded-lg hover:bg-neutral-600 transition text-xs border border-neutral-600 flex items-center gap-2"
                      >
                        <Download size={14} />
                        Экспорт
                      </button>
                      <button
                        onClick={saveDeck}
                        className="bg-neutral-600 hover:bg-neutral-500 text-white px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2 border border-neutral-500"
                      >
                        <Play size={14} />
                        Начать обучение
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {previewCards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-700/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Plus size={24} className="text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm">Добавьте первую карточку</p>
                  </div>
                ) : (
                  previewCards.map((card, idx) => (
                    <div key={card.id} className="group bg-neutral-700/20 border border-neutral-600/50 hover:border-neutral-500/50 rounded-lg p-3 transition">
                      <div className="flex gap-3">
                        {card.image && (
                          <img src={card.image} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="inline-block bg-neutral-700 text-neutral-200 text-xs px-2 py-1 rounded mb-2 font-normal border border-neutral-600">
                            {card.category}
                          </div>
                          <div className="text-white text-sm font-normal line-clamp-2">{card.question}</div>
                        </div>
                        <button
                          onClick={() => setPreviewCards(previewCards.filter((_, i) => i !== idx))}
                          className="text-neutral-500 hover:text-neutral-300 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Game Screen
  if (screen === 'game') {
    return (
      <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex flex-col">
        {/* Table Texture Background */}
        {tableTexture ? (
          <div 
            className="absolute inset-0 transition-all duration-500"
            style={{ 
              backgroundImage: `url(${tableTexture})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          ></div>
        ) : (
          <>
            <div className="absolute inset-0 bg-neutral-900"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
          </>
        )}
        
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2">
                    <div className="text-neutral-400 text-xs mb-1">Прогресс</div>
                    <div className="text-white text-lg font-medium">
                      {cardIndex + 1} <span className="text-neutral-600">/</span> {deck.length}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-neutral-700"></div>
                  <div className="flex gap-2">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
                      <div className="text-neutral-400 text-xs mb-1">Знаю</div>
                      <div className="text-white text-base font-medium">{correctPile.length}</div>
                    </div>
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
                      <div className="text-neutral-400 text-xs mb-1">Повторить</div>
                      <div className="text-white text-base font-medium">{repeatPile.length}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setScreen('start')}
                  className="bg-neutral-800 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition border border-neutral-700 text-sm"
                >
                  Завершить
                </button>
              </div>
            </div>
          </div>

          {/* Game Table - Centered Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-6xl mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center justify-items-center">
                {/* Left: Repeat Pile */}
                <div className="flex flex-col items-center">
                  <div className="text-white text-base mb-4 font-medium flex items-center gap-2">
                    <X size={18} className="text-neutral-400" />
                    На повторение
                  </div>
                  <div className="relative w-52 h-72 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-center group hover:border-neutral-600 transition">
                    {repeatPile.length > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-medium text-neutral-300">{repeatPile.length}</div>
                          <div className="text-neutral-500 text-sm mt-2">карт</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-neutral-600 text-4xl">📚</div>
                    )}
                  </div>
                </div>

                {/* Center: Active Card */}
                <div className="flex flex-col items-center">
                  {currentCard ? (
                    <div
                      ref={cardRef}
                      className={`relative w-96 h-[560px] transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${
                        swipeDirection === 'right' ? 'translate-x-[600px] rotate-12 opacity-0 scale-95' :
                        swipeDirection === 'left' ? '-translate-x-[600px] -rotate-12 opacity-0 scale-95' : ''
                      }`}
                      style={{
                        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotateAngle}deg)`,
                        transition: isDragging ? 'none' : 'all 0.3s ease-out'
                      }}
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchStart={handleDragStart}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                    >
                      {/* Цветной overlay */}
                      <div 
                        className="absolute inset-0 rounded-xl transition-opacity duration-200 z-10 pointer-events-none"
                        style={{
                          backgroundColor: getCardColor(),
                          opacity: (isDragging && dragOffset.x !== 0) ? 1 : 0
                        }}
                      />
                      
                      <div className="relative bg-neutral-800 border border-neutral-700 rounded-xl p-8 h-full flex flex-col z-0">
                        {currentCard.image && (
                          <div className="mb-6 flex-shrink-0">
                            <img src={currentCard.image} alt="" className="w-full h-56 object-cover rounded-lg" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-center text-center">
                          <div className="inline-block mx-auto bg-neutral-700 text-neutral-200 text-sm px-4 py-2 rounded mb-4 font-normal border border-neutral-600">
                            {currentCard.category}
                          </div>
                          <div className="text-white text-xl font-normal leading-relaxed">{currentCard.question}</div>
                        </div>
                        
                        {/* Swipe Instructions */}
                        <div className="flex justify-center gap-8 mt-6">
                          <div className="text-center">
                            <div className="w-10 h-10 bg-neutral-700 border border-neutral-600 rounded-lg flex items-center justify-center mb-2">
                              <ArrowLeft size={18} className="text-neutral-400" />
                            </div>
                            <div className="text-neutral-400 text-xs">Повторить</div>
                          </div>
                          <div className="text-center">
                            <div className="w-10 h-10 bg-neutral-700 border border-neutral-600 rounded-lg flex items-center justify-center mb-2">
                              <ArrowRight size={18} className="text-neutral-400" />
                            </div>
                            <div className="text-neutral-400 text-xs">Знаю</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={drawCard}
                      className="group relative w-96 h-[560px] bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded-xl flex flex-col items-center justify-center text-white transition-all hover:bg-neutral-800/80"
                    >
                      <div className="relative">
                        <div className="text-6xl mb-6 text-neutral-400 group-hover:text-neutral-300 transition-transform">🎴</div>
                        <div className="text-lg font-medium group-hover:text-neutral-200 transition">Взять карточку</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Right: Deck */}
                <div className="flex flex-col items-center">
                  <div className="text-white text-base mb-4 font-medium flex items-center gap-2">
                    🃏 Колода
                  </div>
                  <div className="relative w-52 h-72">
                    {deck.slice(cardIndex).length > 0 ? (
                      <>
                        {/* Основа стопки */}
                        <div className="absolute inset-0 bg-neutral-800 rounded-xl border border-neutral-700"></div>
                        
                        {/* Верхние карты с рубашками */}
                        {deck.slice(cardIndex).slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className="absolute inset-0 rounded-xl border border-neutral-700 transition-transform overflow-hidden"
                            style={{
                              transform: `translateY(-${idx * 6}px) translateX(${idx * 3}px) rotate(${idx % 2 ? 2 : -2}deg)`,
                              zIndex: 10 + idx
                            }}
                          >
                            <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                              {cardBack ? (
                                <img 
                                  src={cardBack} 
                                  alt="Card Back" 
                                  className="w-full h-full object-contain bg-neutral-700"
                                />
                              ) : (
                                <div className="text-neutral-500 text-4xl">🎴</div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Счетчик оставшихся карт */}
                        {deck.slice(cardIndex).length > 3 && (
                          <div className="absolute inset-0 flex items-center justify-center z-0">
                            <div className="text-center">
                              <div className="text-2xl font-medium text-neutral-600">
                                +{deck.slice(cardIndex).length - 3}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-neutral-800 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center">
                        <div className="text-center">
                          <Check size={32} className="text-neutral-500 mx-auto mb-2" />
                          <div className="text-neutral-500 text-sm">Завершено</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Results Screen
  if (screen === 'results') {
    const stats = getStatistics();
    const percentage = Math.round((stats.correct / stats.total) * 100);
    
    return (
      <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-neutral-900"></div>
        <div className="absolute inset-0 bg-[linear-gradient(30deg,_rgba(255,255,255,0.02)_0%,_transparent_50%)]"></div>
        
        <div className="relative z-10 bg-neutral-800 rounded-xl p-8 max-w-md w-full border border-neutral-700">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-white mb-2">
              Обучение завершено
            </h2>
            <p className="text-neutral-400 text-sm">
              {percentage >= 80 ? 'Отличный результат' : percentage >= 60 ? 'Хорошая работа' : 'Продолжайте тренироваться'}
            </p>
          </div>
          
          <div className="bg-neutral-700/30 rounded-lg p-6 mb-6 border border-neutral-600">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-medium text-white mb-1">
                  {percentage}%
                </div>
                <div className="text-neutral-400 text-xs">Эффективность</div>
              </div>
              <div className="h-16 w-px bg-neutral-600"></div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-600 rounded flex items-center justify-center">
                    <Check size={14} className="text-neutral-300" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">{stats.correct}</div>
                    <div className="text-neutral-400 text-xs">Правильно</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-neutral-600 rounded flex items-center justify-center">
                    <X size={14} className="text-neutral-300" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">{repeatPile.length}</div>
                    <div className="text-neutral-400 text-xs">Ошибок</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {stats.strongSides.length > 0 && (
            <div className="bg-neutral-700/30 rounded-lg p-4 mb-4 border border-neutral-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-neutral-300">Сильные стороны</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.strongSides.map((side, idx) => (
                  <div key={idx} className="bg-neutral-600 text-neutral-200 px-2 py-1 rounded text-xs border border-neutral-500">
                    {side}
                  </div>
                ))}
              </div>
            </div>
          )}

          {repeatPile.length > 0 && (
            <div className="bg-neutral-700/30 rounded-lg p-4 mb-6 border border-neutral-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-neutral-300">Требуют внимания</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {[...new Set(repeatPile.map(c => c.category))].map((cat, idx) => (
                  <div key={idx} className="bg-neutral-600 text-neutral-200 px-2 py-1 rounded text-xs border border-neutral-500">
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {repeatPile.length > 0 && (
              <button
                onClick={repeatErrors}
                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border border-neutral-600"
              >
                <RotateCcw size={16} />
                Повторить ошибки ({repeatPile.length})
              </button>
            )}
            
            <button
              onClick={restartGame}
              className="w-full bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Начать заново
            </button>
            
            <button
              onClick={() => setScreen('start')}
              className="w-full bg-neutral-600 hover:bg-neutral-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border border-neutral-500"
            >
              <Plus size={16} />
              Новая колода
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default App;
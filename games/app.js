/* Common Room: local prototype. No network calls, accounts, or live content. */
(() => {
  'use strict';
  const G = window.GameCore;
  const KEY = 'glass-idea-09-prototype-v1';
  const puzzles = [
    { title: 'Everyday little things', groups: [
      {name:'Musical instruments', words:['CELLO','FLUTE','HARP','OBOE']},
      {name:'Citrus fruits', words:['LEMON','LIME','ORANGE','POMELO']},
      {name:'Trees', words:['BIRCH','ELM','MAPLE','OAK']},
      {name:'Fabrics', words:['DENIM','LINEN','SATIN','VELVET']}
    ]},
    { title: 'Out in the world', groups: [
      {name:'Planets', words:['MARS','VENUS','SATURN','NEPTUNE']},
      {name:'Shapes', words:['CIRCLE','OVAL','SQUARE','TRIANGLE']},
      {name:'Birds', words:['HERON','ROBIN','SPARROW','WREN']},
      {name:'Kitchen utensils', words:['LADLE','SPATULA','TONGS','WHISK']}
    ]}
  ];
  const initialOrder = [6,12,2,8,10,0,14,5,1,7,9,15,11,3,4,13];
  function freshPuzzle(index = 0) { return {index,order:[...initialOrder],selected:[],solved:[],mistakes:0,attempted:[],hinted:false}; }
  function fresh() {return {version:1,reversiStarted:false,moves:[],puzzleStarted:false,puzzle:freshPuzzle(),showMoves:true};}
  let state = fresh();
  let board = G.initialReversi();
  let storageOK = true;
  let feedback = '';
  let boardFeedback = '';
  let modalCallback = null;
  const main = document.getElementById('main');
  const dialog = document.getElementById('modal');
  document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); });
  const names = {1:'Black',2:'White'};
  const coord = n => `${'ABCDEFGH'[n%8]}${Math.floor(n/8)+1}`;
  const isInts = (a,min,max,limit) => Array.isArray(a) && a.length<=limit && a.every(n=>Number.isInteger(n)&&n>=min&&n<=max);
  function validate(raw) {
    if (!raw || raw.version!==1 || typeof raw.reversiStarted!=='boolean' || typeof raw.puzzleStarted!=='boolean' || typeof raw.showMoves!=='boolean' || !isInts(raw.moves,0,63,60)) throw Error('Invalid session');
    let b = G.initialReversi();
    for(const n of raw.moves) {b = G.playReversi(b,n); if(!b) throw Error('Invalid move history');}
    const p=raw.puzzle;
    if(!p || !Number.isInteger(p.index) || !puzzles[p.index] || !isInts(p.order,0,15,16) || p.order.length!==16 || new Set(p.order).size!==16 || !isInts(p.solved,0,3,4) || new Set(p.solved).size!==p.solved.length || !isInts(p.selected,0,15,4) || new Set(p.selected).size!==p.selected.length || !Number.isInteger(p.mistakes) || p.mistakes<0 || p.mistakes>4 || typeof p.hinted!=='boolean' || !Array.isArray(p.attempted) || p.attempted.length!==p.mistakes || p.attempted.some(s=>typeof s!=='string'||!/^\d+(,\d+){3}$/.test(s)) || p.selected.some(n=>p.solved.includes(Math.floor(n/4))) || ((p.solved.length===4||p.mistakes===4)&&p.selected.length)) throw Error('Invalid puzzle');
    return {state:raw,board:b};
  }
  function warning(text) {const w=document.getElementById('storage-warning');w.textContent=text;w.hidden=false;}
  try {
    const saved=localStorage.getItem(KEY);
    if(saved){const valid=validate(JSON.parse(saved));state=valid.state;board=valid.board;}
  } catch(e) {
    if(e instanceof SyntaxError || e.message.startsWith('Invalid')) warning('The saved prototype session could not be read. A fresh session is ready; your next action will replace the unreadable save.');
    else {storageOK=false;warning('Browser storage is unavailable. You can play, but progress will only last while this page stays open.');}
  }
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;document.getElementById('storage-warning').hidden=true;}
    catch {storageOK=false;warning('Progress could not be saved in this browser. Keep this page open to continue this session.');}
  }
  function say(text) {document.getElementById('announcement').textContent=text;}
  const savedLabel = () => `<span class="save-label">${storageOK?'✓ Saves in this browser':'Temporary session · saving unavailable'}</span>`;
  const miniBoard = () => `<div class="mini-board" aria-hidden="true">${Array.from({length:16},(_,i)=>`<span>${[5,6,9,10].includes(i)?`<i class="${[6,9].includes(i)?'dark':''}"></i>`:''}</span>`).join('')}</div>`;
  const miniWords = () => '<div class="mini-words" aria-hidden="true"><span>MAPLE</span><span>OAK</span><span>BIRCH</span><span>ELM</span></div>';
  function pageTop() {return `<div class="page-top"><a class="text-link" href="#library">← Back to the collection</a>${savedLabel()}</div>`;}
  function puzzleStatus() {return state.puzzle.solved.length===4?'won':state.puzzle.mistakes===4?'lost':'playing';}
  function library() {
    const resumeB = state.reversiStarted, resumeP = state.puzzleStarted;
    return `<section class="hero"><div><div class="eyebrow">A collection for curious minds</div><h1>A little room<br>for play.</h1><p>Find your next move. Spot a small connection.<br>A few good games, together in one place.</p><div class="hero-note"><span aria-hidden="true">✓</span>Pick a game. Your progress stays in this browser when storage is available.</div></div><div class="hero-art" aria-hidden="true"><div class="art-board"><i class="art-disc"></i><i class="art-disc dark"></i></div><span class="art-tile">YOUR MOVE</span></div></section>
    <section aria-labelledby="play-heading"><div class="section-heading"><h2 id="play-heading">On the table</h2><p>02 playable · take your time</p></div><div class="cards">
      <article class="game-card"><div class="card-art">${miniBoard()}</div><div class="card-content"><span class="tag">Board game · two people</span><h3>Reversi</h3><p>A quiet battle of black and white. Share a device and turn the board your way.</p><div class="card-bottom"><span class="small muted">8 × 8 · local play</span><a class="btn" href="#reversi">${resumeB?(board.status==='finished'?'View result':'Resume'):'Play'} <span aria-hidden="true">↗</span></a></div></div></article>
      <article class="game-card"><div class="card-art word">${miniWords()}</div><div class="card-content"><span class="tag">Word puzzle · solo</span><h3>Word Families</h3><p>Sixteen words. Four hidden families. Find the things that belong together.</p><div class="card-bottom"><span class="small muted">2 original samples</span><a class="btn" href="#words">${resumeP?(puzzleStatus()==='playing'?'Resume':'View result'):'Play'} <span aria-hidden="true">↗</span></a></div></div></article>
    </div></section><div class="collection-note"><p><strong>A small beginning, with more room to grow.</strong> The full idea is a 10–15-game collection. This prototype explores two kinds of play; the proposed wider shelf is still to be built.</p><a class="text-link" href="#plan">Explore the proposed collection →</a></div>`;
  }
  function reversiRules() {return `<details class="rules"><summary>How to play Reversi</summary><ol><li>Black starts. Take turns sharing this device.</li><li>Place a disc on an empty square to trap a straight line of opposing discs between it and one of yours. Horizontal, vertical and diagonal lines count.</li><li>All discs trapped by that placement change to your colour. Every move must flip at least one disc.</li><li>A player without a legal move automatically passes. The game ends when neither player can move, even if empty squares remain.</li><li>The colour with more discs wins; equal counts are a draw.</li></ol><p>Casual 8 × 8 rules. No clocks or tournament adjudication. Undo is available by agreement between players.</p><p>Rule reference: <a class="text-link" target="_blank" rel="noopener noreferrer" href="https://www.worldothello.org/about/about-othello/othello-rules/official-rules/english">World Othello Federation</a>. Original graphics; no affiliation or licensed branding claimed.</p></details>`;}
  function reversi() {
    const scores=G.scoreReversi(board), legal=G.legalMoves(board), done=board.status==='finished';
    const heading=done?(board.winner===0?'An even match.':`${names[board.winner]} wins.`):`${names[board.turn]} to move`;
    return `${pageTop()}<div class="play-layout"><section><div class="board-title"><div><div class="eyebrow">Two people · one device</div><h1>Reversi</h1></div><span class="small muted">8 × 8</span></div><div class="board-frame"><div class="coordinates" aria-hidden="true">${'ABCDEFGH'.split('').map(c=>`<span>${c}</span>`).join('')}</div><div class="board" role="group" aria-label="Reversi board. Arrow keys move between squares. Enter plays.">${board.board.map((v,i)=>`<button id="cell-${i}" class="cell ${state.showMoves&&legal.includes(i)?'legal':''} ${board.lastMove===i?'last':''}" data-action="move" data-index="${i}" aria-label="${coord(i)}, ${v?names[v]+' disc':(legal.includes(i)?'legal move':'empty, no legal move')}${board.lastMove===i?', last move':''}" aria-disabled="${done||!legal.includes(i)}" tabindex="${i===(legal[0]??0)?0:-1}">${v?`<span class="disc ${v===1?'black':'white'}" aria-hidden="true"></span>`:''}</button>`).join('')}</div></div><div class="board-caption"><span><i class="dot-outline" aria-hidden="true"></i>${state.showMoves?'Dots mark legal moves':'Move markers hidden'}</span><span>Arrow keys to explore · Enter to play</span></div></section><aside class="play-aside"><div class="eyebrow">${done?'Match complete':`Move ${state.moves.length+1}`}</div><div class="score-row"><div class="score ${!done&&board.turn===1?'active':''}"><i class="disc black" aria-hidden="true"></i><span>Black</span><b>${scores.black}</b></div><div class="score ${!done&&board.turn===2?'active':''}"><i class="disc white" aria-hidden="true"></i><span>White</span><b>${scores.white}</b></div></div><div class="turn-box"><h2>${heading}</h2><p id="board-feedback">${boardFeedback || (done?`${scores.black} black · ${scores.white} white. Neither player has a legal move.`:board.pass?`${names[board.pass]} has no legal move and automatically passes. ${names[board.turn]} plays again.`:`${legal.length} legal moves available. Place a disc to capture a line.`)}</p></div><div class="actions"><button id="undo" class="btn secondary" data-action="undo" ${state.moves.length?'':'disabled'}>↶ Undo move</button><button class="btn secondary" data-action="restart-board">New match</button></div><label class="check-label"><input type="checkbox" id="show-moves" ${state.showMoves?'checked':''}> Show legal moves</label>${reversiRules()}<div class="note-box"><strong>Pass the device, keep the conversation.</strong><br>This is local play for two people. Computer opponents and online matches are outside this prototype.</div></aside></div>`;
  }
  function words() {
    const p=state.puzzle, puzzle=puzzles[p.index], status=puzzleStatus(), flat=puzzle.groups.flatMap(g=>g.words);
    const shown = status==='lost' ? [...p.solved,...[0,1,2,3].filter(i=>!p.solved.includes(i))] : p.solved;
    return `${pageTop()}<div class="puzzle-layout"><section><div class="puzzle-header"><div class="eyebrow">An original sample · solo play</div><h1>Word Families</h1><p>Select four words that share a theme. Find all four families.</p></div><div class="puzzle-area"><div class="puzzle-meta"><span>Sample 0${p.index+1} / 02 · ${puzzle.title}</span><span>${p.solved.length} / 4 found</span></div>${status!=='playing'?`<div class="result-panel"><h2>${status==='won'?'Everything belongs.':'A few new connections.'}</h2><p>${status==='won'?`You found all four families with ${p.mistakes} ${p.mistakes===1?'mistake':'mistakes'}. ${p.hinted?'Category hint used.':''}`:'Four mistakes used. The complete answer is shown below.'}</p><button class="btn" id="next-puzzle" data-action="next-puzzle">Play sample 0${p.index===0?'2':'1'} →</button></div>`:''}<div id="solved-groups">${shown.map(i=>`<div class="solved-group"><strong>${puzzle.groups[i].name}${status==='lost'&&!p.solved.includes(i)?' · revealed':''}</strong><span>${puzzle.groups[i].words.join(' · ')}</span></div>`).join('')}</div><div class="word-grid" aria-label="Word tiles">${status==='playing'?p.order.filter(i=>!p.solved.includes(Math.floor(i/4))).map(i=>`<button class="word-tile ${p.selected.includes(i)?'selected':''}" id="word-${i}" aria-pressed="${p.selected.includes(i)}" data-action="word" data-index="${i}">${flat[i]}</button>`).join(''):''}</div><div class="puzzle-feedback" id="puzzle-feedback">${feedback || (status==='playing'?`${p.selected.length} of 4 words selected`:'You can revisit this result from Your sessions.')}</div>${status==='playing'?`<div class="puzzle-actions"><button class="btn secondary" data-action="shuffle" id="shuffle">Shuffle</button><button class="btn secondary" data-action="deselect" id="deselect" ${p.selected.length?'':'disabled'}>Clear</button><button class="btn" data-action="submit" id="submit" ${p.selected.length===4?'':'disabled'}>Check family</button></div><div class="mistakes">Mistakes left ${Array.from({length:4},(_,i)=>`<i class="${i>=4-p.mistakes?'used':''}" aria-hidden="true"></i>`).join('')}<span class="sr-only">${4-p.mistakes}</span></div>`:''}</div></section><aside class="puzzle-aside"><h2>A small moment<br>of discovery.</h2><p class="small muted">Think of what each word can be, then look for its neighbours.</p><details class="rules" open><summary>How to play</summary><ol><li>Choose four words with one shared theme.</li><li>Check your family. A correct group stays together.</li><li>You have four mistakes. A repeated wrong guess does not cost another.</li><li>Find all four groups to finish. After four mistakes, the remaining groups are revealed.</li></ol></details><div class="actions"><button class="btn secondary" id="hint" data-action="hint" ${status==='playing'?'':'disabled'}>Reveal a category</button><button class="btn quiet" data-action="restart-puzzle">Restart sample</button></div><div class="note-box"><strong>Two original sample puzzles.</strong><br>Created for this prototype; not a daily feed. This is a proposed grouping-puzzle interpretation of the source reference “connections”, with original content and presentation. No branded puzzle sets are used.</div></aside></div>`;
  }
  function sessions() {
    const score=G.scoreReversi(board), p=state.puzzle;
    return `<div class="page-title"><div class="eyebrow">Come back whenever</div><h1>Right where you left off.</h1><p>One local session per game. Progress stays in this browser when storage is available; it does not sync between devices.</p></div><div class="sessions-grid"><article class="session-card"><div class="tag">Local board game</div><h2>Reversi</h2><p>${state.reversiStarted?(board.status==='finished'?`Match complete · ${board.winner?names[board.winner]+' wins':'Draw'}`:`${state.moves.length} moves played · ${names[board.turn]} to move`):'A fresh board is waiting.'}</p><p class="small">Black ${score.black} · White ${score.white}</p><div class="progress-bar"><span style="width:${(64-score.empty)/64*100}%"></span></div><a class="btn" href="#reversi">${state.reversiStarted?(board.status==='finished'?'View result':'Resume match'):'Start match'} →</a></article><article class="session-card"><div class="tag">Original sample puzzle</div><h2>Word Families</h2><p>${state.puzzleStarted?`Sample 0${p.index+1} · ${puzzleStatus()==='won'?'Complete':puzzleStatus()==='lost'?'Answers revealed':p.solved.length+' of 4 families found'}`:'Your first sample is ready.'}</p><p class="small">${4-p.mistakes} mistakes remaining</p><div class="progress-bar"><span style="width:${p.solved.length*25}%"></span></div><a class="btn" href="#words">${state.puzzleStarted?(puzzleStatus()==='playing'?'Resume puzzle':'View result'):'Start puzzle'} →</a></article></div><div class="note-box">${storageOK?'Local saving is available. Clearing browser data removes these sessions.':'Saving is unavailable. These sessions last only while this page stays open.'} This prototype has no account, cloud save, rankings or matchmaking.</div>`;
  }
  const roadmap = [
    ['Reversi','Local, two people; full match loop in this prototype.','Playable · two players, one device','reversi'],
    ['Word Families','Two original grouping puzzles; solo play.','Playable · solo','words'],
    ['Chess','Named in the original idea. Rules and modes to choose.','Named example · not built'],
    ['Go / Weiqi','Both source names, one game. Board size and rules to choose.','Named example · not built'],
    ['Checkers','Named in the original idea. Regional variant to choose.','Named example · not built'],
    ['Crosswords','Named in the original idea. Needs original puzzle content.','Named example · not built'],
    ['Sudoku','A possible number-puzzle addition.','New proposal · not built'],
    ['Backgammon','A possible dice-and-board addition.','New proposal · not built'],
    ['Mancala','A possible sowing game; specific variant undecided.','New proposal · not built'],
    ['Nine Men’s Morris','A possible local strategy addition.','New proposal · not built'],
    ['Hex','A possible connection-board addition.','New proposal · not built'],
    ['Nonograms','A possible picture-logic addition.','New proposal · not built']
  ];
  function plan() {return `<div class="page-title"><div class="eyebrow">The bigger picture</div><h1>One shelf. Many ways to play.</h1><p>The author’s full intent is a collection of 10–15 playable games. This is a proposed 12-game path, not a confirmed final list or a delivered catalogue.</p></div><div class="plan-intro"><span class="count">2<span class="muted">/12</span></span><p><strong>Playable now in this prototype.</strong><br>The other ten entries are visible planning cards. Source names “chess, go, othello, connections, weiqi, checkers, crosswords” are preserved here; Go and Weiqi occupy one slot. Wider game-story exploration belongs to separate idea 9.5.</p></div><div class="plan-list">${roadmap.map((g,i)=>`<article class="plan-card ${g[3]?'live':''}"><span class="eyebrow">${String(i+1).padStart(2,'0')}</span><h3>${g[0]}</h3><p>${g[1]}</p><div class="status">${g[2]}</div>${g[3]?`<a class="text-link" href="#${g[3]}" style="display:inline-block;margin-top:16px">Open game →</a>`:''}</article>`).join('')}</div><div class="collection-note"><p><strong>Decisions for a later build:</strong> agree the final games and rule variants, choose local/online/computer modes, review rights and original content, and test with real players. The two sample word puzzles have not had independent ambiguity testing.</p><a class="text-link" href="#library">Back to the playable collection →</a></div>`;}
  function route() {return location.hash.slice(1)||'library';}
  function render(focusId) {
    const r=route();
    main.innerHTML=({library,reversi,words,sessions,plan}[r]||library)();
    document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===r;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=`${({reversi:'Reversi',words:'Word Families',sessions:'Your sessions',plan:'The bigger picture'}[r]||'The collection')} · Common Room prototype`;
    if(focusId) {
      const el = document.getElementById(focusId);
      if(el && !el.disabled) el.focus({preventScroll:true});
      else main.focus({preventScroll:true});
    }
  }
  function enterRoute() {
    boardFeedback='';feedback='';
    if(route()==='reversi'&&!state.reversiStarted){state.reversiStarted=true;save();}
    if(route()==='words'&&!state.puzzleStarted){state.puzzleStarted=true;save();}
    render();window.scrollTo(0,0);main.focus({preventScroll:true});
  }
  function modal(title,text,button,callback) {
    document.getElementById('modal-body').innerHTML=`<h2 id="modal-title">${title}</h2><p>${text}</p><div class="dialog-actions"><button class="btn secondary" data-action="close-modal">Keep playing</button><button class="btn" data-action="confirm-modal">${button}</button></div>`;
    modalCallback=callback;dialog.showModal();
  }
  function closeModal(){dialog.close();modalCallback=null;}
  document.querySelector('.dialog-close').addEventListener('click',closeModal);
  dialog.addEventListener('cancel',()=>{modalCallback=null;});
  document.addEventListener('click',e=>{
    const target=e.target.closest('[data-action]');if(!target||target.disabled)return;
    const action=target.dataset.action, n=Number(target.dataset.index), p=state.puzzle;
    let focus=target.id;
    if(action==='close-modal'){closeModal();return;}
    if(action==='confirm-modal'){const cb=modalCallback;closeModal();cb?.();return;}
    if(action==='restart-board'){modal('Start a new match?','This replaces the Reversi match saved in this browser. Your word puzzle will stay as it is.','Start new match',()=>{state.moves=[];board=G.initialReversi();boardFeedback='';save();render('cell-19');say('New Reversi match. Black starts.');});return;}
    if(action==='restart-puzzle'){modal('Restart this sample?','This resets the selections, found families and mistakes for this sample.','Restart sample',()=>{state.puzzle=freshPuzzle(p.index);feedback='';save();render('word-6');say('Sample restarted.');});return;}
    if(action==='move') {
      const next=G.playReversi(board,n);
      if(!next){boardFeedback=board.status==='finished'?'This match is complete. Start a new match to play again.':`${coord(n)} is not a legal move. Choose an empty square that traps at least one opposing disc.`;say(boardFeedback);render(`cell-${n}`);return;}
      const player=names[board.turn];board=next;state.moves.push(n);boardFeedback='';
      say(`${player} played ${coord(n)}. ${board.status==='finished'?(board.winner?names[board.winner]+' wins.':'Draw.'):board.pass?`${names[board.pass]} passes. ${names[board.turn]} plays again.`:names[board.turn]+' to move.'}`);
      focus=`cell-${G.legalMoves(board)[0]??n}`;
    } else if(action==='undo') {
      if(!state.moves.length)return;state.moves.pop();board=G.initialReversi();for(const m of state.moves)board=G.playReversi(board,m);boardFeedback='Last move undone. '+names[board.turn]+' to move.';say(boardFeedback);
    } else if(action==='word') {
      if(puzzleStatus()!=='playing'||p.solved.includes(Math.floor(n/4)))return;
      if(p.selected.includes(n))p.selected=p.selected.filter(i=>i!==n);
      else if(p.selected.length<4)p.selected.push(n);
      else {feedback='Four words are selected. Clear one before choosing another.';say(feedback);render(focus);return;}
      feedback=`${p.selected.length} of 4 words selected`;say(feedback);
    } else if(action==='deselect'){p.selected=[];feedback='Selection cleared.';say(feedback);focus='shuffle';
    } else if(action==='shuffle'){
      for(let i=p.order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p.order[i],p.order[j]]=[p.order[j],p.order[i]];}
      feedback='Words shuffled. Your selection is kept.';say(feedback);
    } else if(action==='submit') {
      if(puzzleStatus()!=='playing'||p.selected.length!==4)return;
      const guess=[...p.selected].sort((a,b)=>a-b).join(',');
      const family=Math.floor(p.selected[0]/4);
      if(p.selected.every(i=>Math.floor(i/4)===family)) {p.solved.push(family);p.selected=[];feedback=p.solved.length===4?'All four families found. Well played.':`${puzzles[p.index].groups[family].name} — family found.`;focus=p.order.filter(i=>!p.solved.includes(Math.floor(i/4))).map(i=>'word-'+i)[0];}
      else if(p.attempted.includes(guess))feedback='You have tried that combination already. No extra mistake used.';
      else {p.attempted.push(guess);p.mistakes++;const counts=[0,0,0,0];p.selected.forEach(i=>counts[Math.floor(i/4)]++);feedback=p.mistakes===4?'Four mistakes used. The remaining families are revealed.':counts.includes(3)?'One word away. Try changing one word.':'Those words do not form one family. Try another connection.';if(p.mistakes===4)p.selected=[];}
      say(feedback);
    } else if(action==='hint'){
      if(puzzleStatus()!=='playing')return;p.hinted=true;const i=[0,1,2,3].find(i=>!p.solved.includes(i));feedback=`Category hint: ${puzzles[p.index].groups[i].name}. This does not use a mistake.`;say(feedback);
    } else if(action==='next-puzzle'){state.puzzle=freshPuzzle(p.index===0?1:0);feedback='';say('Next original sample ready.');}
    else return;
    if(route()==='words') {
      if(puzzleStatus()!=='playing') focus='next-puzzle';
      else if(action==='next-puzzle') focus='word-6';
      else if(action==='hint') focus='hint';
    }
    save();render(focus);
  });
  document.addEventListener('change',e=>{if(e.target.id==='show-moves'){state.showMoves=e.target.checked;save();render('show-moves');}});
  document.addEventListener('keydown',e=>{
    if(!e.target.matches('.cell'))return;
    const index=Number(e.target.dataset.index),row=Math.floor(index/8),col=index%8;
    let next;
    if(e.key==='ArrowRight')next=row*8+(col+1)%8;
    if(e.key==='ArrowLeft')next=row*8+(col+7)%8;
    if(e.key==='ArrowDown')next=((row+1)%8)*8+col;
    if(e.key==='ArrowUp')next=((row+7)%8)*8+col;
    if(e.key==='Home')next=row*8;
    if(e.key==='End')next=row*8+7;
    if(next!==undefined){e.preventDefault();document.querySelectorAll('.cell').forEach(c=>c.tabIndex=-1);const cell=document.getElementById(`cell-${next}`);cell.tabIndex=0;cell.focus();}
  });
  window.addEventListener('hashchange',enterRoute);
  window.addEventListener('storage',e=>{if(e.key===KEY)warning('This prototype session changed in another tab. Reload to use that save; continuing here will replace it with this tab’s progress.');});
  enterRoute();
})();

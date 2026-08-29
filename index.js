const seatIds = ["A1","A2","A3","A4","B1","B2","B3","B4","C1","C2","C3","C4"];
const storageKey = "classroom-seat-status-v1";
const seatGrid = document.getElementById("seatGrid");
const summaryGrid = document.getElementById("summaryGrid");
const resetButton = document.getElementById("resetButton");
const activityMessage = document.getElementById("activityMessage");
const searchInput = document.getElementById("searchInput");
const filterGroup = document.getElementById("filterGroup");
const sortSelect = document.getElementById("sortSelect");
const resultMessage = document.getElementById("resultMessage");
let seats = loadSeats();
let activeFilter = "all";

function emptySeats(){ return seatIds.map(function(id){ return {id:id,name:"",minutes:0,editing:false}; }); }
function loadSeats(){ try { const saved=JSON.parse(localStorage.getItem(storageKey)); if(Array.isArray(saved)&&saved.length===seatIds.length)return saved; } catch(error){} return emptySeats(); }
function saveSeats(){ localStorage.setItem(storageKey,JSON.stringify(seats)); }
function setMessage(message){ activityMessage.textContent=message; }
function getSeat(id){ return seats.find(function(seat){return seat.id===id;}); }
function renderSummary(){
  const occupied=seats.filter(function(seat){return seat.name.trim();}).length;
  const totalMinutes=seats.reduce(function(sum,seat){return sum+seat.minutes;},0);
  summaryGrid.innerHTML='<div class="summary-item"><span class="label">빈 좌석</span><span class="value">'+(seats.length-occupied)+'<span class="unit">석</span></span></div><div class="summary-item occupied"><span class="label">사용 중</span><span class="value">'+occupied+'<span class="unit">석</span></span></div><div class="summary-item total"><span class="label">총 이용시간</span><span class="value">'+totalMinutes+'<span class="unit">분</span></span></div>';
}
function renderSeats(){
  seatGrid.replaceChildren();
  const query = searchInput.value.trim().toLowerCase();
  const visibleSeats = seats.filter(function(seat){
    const matchesSearch = !query || seat.id.toLowerCase().includes(query) || seat.name.toLowerCase().includes(query);
    const isRest = seat.minutes >= 120;
    const isActive = Boolean(seat.name.trim());
    const matchesFilter = activeFilter === "all" || (activeFilter === "empty" && !isActive) || (activeFilter === "active" && isActive) || (activeFilter === "rest" && isRest);
    return matchesSearch && matchesFilter;
  }).sort(function(a,b){ return sortSelect.value === "time" ? b.minutes-a.minutes || a.id.localeCompare(b.id) : a.id.localeCompare(b.id); });
  resultMessage.textContent = visibleSeats.length + "개의 좌석이 표시되고 있습니다.";
  visibleSeats.forEach(function(seat){
    const active=Boolean(seat.name.trim()),restNeeded=seat.minutes>=120;
    const card=document.createElement("article");
    card.className="seat-card"+(active?" active":"")+(restNeeded?" rest-needed":"");
    card.dataset.id=seat.id;
    card.innerHTML='<div class="seat-top"><span class="seat-number">'+seat.id+'</span><span class="status-badge">'+(restNeeded?"휴식 필요":active?"사용 중":"이용 가능")+'</span></div><div class="seat-info"><p class="seat-user">'+(active?escapeHtml(seat.name):"이용자 없음")+'</p><p class="seat-time">'+(active?"남은시간 "+seat.minutes+"분":"0분")+'</p>'+(restNeeded?'<p class="rest-message">장시간 이용 중이에요. 잠시 쉬어 주세요.</p>':"")+'</div>';
    if(seat.editing){
      const editor=document.createElement("div"); editor.className="name-editor";
      editor.innerHTML='<input class="name-input" type="text" maxlength="20" placeholder="이름을 입력하세요" autocomplete="off"><button class="use-button" type="button">저장</button>';
      editor.querySelector(".name-input").value=seat.name; card.querySelector(".seat-info").append(editor); editor.querySelector(".name-input").focus();
    }
    const actions=document.createElement("div"); actions.className="seat-actions";
    if(!active||seat.editing){ if(!seat.editing)actions.innerHTML='<button class="use-button" type="button">이용하기</button>'; }
    else actions.innerHTML='<button class="time-button" type="button">30분 추가</button><button class="end-button" type="button">종료</button>';
    card.append(actions); seatGrid.append(card);
  });
}
function render(){ renderSummary(); renderSeats(); }
function escapeHtml(value){ const div=document.createElement("div"); div.textContent=value; return div.innerHTML; }
function startEditing(id){ getSeat(id).editing=true; renderSeats(); }
function saveName(id,input){
  const name=input.value.trim(); if(!name){setMessage("이용자 이름을 입력해 주세요.");input.focus();return;}
  const seat=getSeat(id); seat.name=name; seat.minutes=30; seat.editing=false; saveSeats(); render(); setMessage(id+" 좌석을 "+name+"님이 이용하기 시작했습니다. 기본 이용시간 30분이 추가되었습니다.");
}
seatGrid.addEventListener("click",function(event){
  const card=event.target.closest(".seat-card"); if(!card)return;
  const id=card.dataset.id,seat=getSeat(id);
  if(event.target.closest(".use-button")){const input=card.querySelector(".name-input");input?saveName(id,input):startEditing(id);return;}
  if(event.target.closest(".time-button")){seat.minutes+=30;saveSeats();render();setMessage(id+" 좌석에 30분을 추가했습니다."+(seat.minutes>=120?" 휴식이 필요합니다.":""));return;}
  if(event.target.closest(".end-button")){Object.assign(seat,{name:"",minutes:0,editing:false});saveSeats();render();setMessage(id+" 좌석의 이용을 종료했습니다.");}
});
seatGrid.addEventListener("keydown",function(event){if(event.key==="Enter"&&event.target.matches(".name-input"))saveName(event.target.closest(".seat-card").dataset.id,event.target);});
searchInput.addEventListener("input",renderSeats);
filterGroup.addEventListener("click",function(event){const button=event.target.closest(".filter-button");if(!button)return;activeFilter=button.dataset.filter;filterGroup.querySelectorAll(".filter-button").forEach(function(item){item.classList.toggle("selected",item===button);});renderSeats();});
sortSelect.addEventListener("change",renderSeats);
resetButton.addEventListener("click",function(){seats=emptySeats();localStorage.removeItem(storageKey);render();setMessage("모든 좌석이 처음 상태로 초기화되었습니다.");});
render();

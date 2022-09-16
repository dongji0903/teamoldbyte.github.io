/** 크래프트 문제 진행 화면
 * @author LGM
 */
(function craftPlayer($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	
	let solveResults = []; // 연속 맞힘 기록
	let _contentType; // 플레이 컨텐츠 종류(step, grammar, workbook)
	let _contentId; // 지정된 컨텐츠가 있을 경우 해당 컨텐츠 아이디
	let currentBattle, battlePool = []; // 현재 문제, 현재 문제 풀
	let _memberId, _ageGroup; // 사용자 정보
	
	
	
	
	
	/*
	TBD:
		비회원의 경우 FreeMembership 가입할 때부터 memberId 로컬에 저장.
		서버로 문제 요청 시 memberId, battleId, engLevel 전달.
		문제를 조회 혹은 풀 때마다 indexedDB 업데이트하여 저장.
		
	 */
	
	
	
	
	
	
	
	
	
	
	
	const DB_NAME = 'findsvoc-idb';	// url 호스트별로 유일한 데이터베이스명을 가집니다.
	const DB_VERSION = 1;	// 데이터베이스 버전(테이블 스키마 변경이 필요할 경우 올리세요.)
	const DB_STORE_NAME = 'likedb';	// 테이블명
	let req, idb, idbstore;
	
	let selectHistory = []; // 현재 문제에서 선택한 선택지들 모음(1,2,5유형용)
	
	$(document).on('click', '.js-solve-btn', function() {
		
		// 채점 전송 버튼을 단계 넘김 버튼으로 전환 
		$(this).toggleClass('js-solve-btn js-next-btn').text('다음');
		
		const view = this.closest('.battle-section');
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let correct = true;
		// 각 배틀타입에 맞게 채점 진행
		switch(currentBattle.battleType) {
			case '1':
				const answerIndexes = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					if(null != answers.find(([aStart,aEnd]) => start == aStart && end == aEnd))
						answerIndexes.push(i);
				});
				view.querySelectorAll('.option').forEach((sel, i) => {
					if(!answerIndexes.includes(i)) {
						if(sel.matches('.selected')) {
							correct = false;
							sel.className = 'text-danger';
						}
					}else sel.className = 'text-primary';
				})
				
				break;	
			case '2':
				let [ modifiers, modificands ] = Array.from(answers, pair => Array.from(pair, m => JSON.stringify(m)));
				view.querySelectorAll('.option').forEach(opt => {
					if(!modifiers.includes(JSON.stringify(findPositions(view, opt)[0]))
					&& !modificands.includes(JSON.stringify(findPositions(view, opt)[0]))) {
						if(opt.matches('.selected')) {
							correct = false;
							opt.className = 'text-danger';
						}
					}else opt.className = 'text-primary';
				})
				break;
			case '3':
				const selectedText = view.querySelector('.example-btn-section .active').textContent;
				if(answers.includes(selectedText)) correct = true;
				else correct = false;
				break;
			case '4':
				const selectedIndex = $(view).find('.example-btn-section .active').index();
				correct = selectedIndex == Array.from(examples, e => JSON.stringify(e)).indexOf(JSON.stringify(answers[0]));
				break;
			case '5':
				correct = view.querySelector('.arranged-examples').textContent.replace(/\W/g,'').trim() == currentBattle.eng.replace(/\W/g,'').trim();
				break;
		}
		alert(correct? '맞혔습니다' : '틀렸습니다');
		const command = { memberId: _memberId, ageGroup: _ageGroup, battleId: currentBattle.bid, correct, save: false };
		
		$(view).find('.explain-section').show().find('.comment-section').text(currentBattle.comment);
		// (ajax) 해설정보 조회 및 표시
		$.getJSON(`/craft/battle/${currentBattle.sentenceId}`, battleAnswerInfo => 
				displayAnswerInfo(currentBattle.eng, view.querySelector('.explain-section'), battleAnswerInfo))
		// (ajax) 배틀 채점 정보 전송
		$.ajax({
			url: '/craft/battle/evaluation/add',
			type: 'GET', contentType: 'application/json', data: command,
			error: () => alert('채점 전송에 실패했습니다. 재로그인 후 다시 시도해 주세요.')
		})
	})
	// 단계 넘김 버튼을 누르면 단계 넘김 버튼을 다시 채점 전송 버튼으로 전환 후 다음 문제 진행
	.on('click', '.js-next-btn', function() {
		this.disabled = true;
		$(this).toggleClass('js-solve-btn js-next-btn').text('확인');
		// 클라이언트에 남은 다음 문제 진행
		if(battlePool.length > 0) {
			_askStep();
		}
		// 남은 문제가 없으면 새로 문제를 조회하여 진행	
		else _getNextBattles();		
	})
	// svoc 분석이 펼쳐질 때 줄바꿈 재처리
	.on('shown.bs.collapse', '.svoc-section', function() {
		tandem.correctMarkLine(this.querySelector('.semantics-result'))
	})
	
	// 다음 20문제 가져오기
	function _getNextBattles() {
		const contentPath = _contentId ? `/${ntoa(_contentId)}` : ''
		const url = `/craft/battle/${_contentType}${contentPath}/next`
		$.getJSON(url, function(battles) {
			battlePool = battles;
			if(battles.length == 0) alert('조회된 문제가 없습니다.')
			else {
				if(_memberId == 0) {
					req = window.indexedDB.open(DB_NAME, DB_VERSION);
					req.onsuccess = function() {
						idb = this.result;
						const tx = idb.transaction(['Battle'], 'readwrite');
						idbstore = tx.objectStore('Battle');
						// 전체 레코드를 조회
						req = idbstore.openCursor();
						req.onsuccess = function() {
							const cursor = this.result;
							if(cursor) {
								// 레코드에 해당하는 버튼을 찾아 좋아요 표시 클래스를 적용합니다.
								const [likeUser, likeTarget] = atob(cursor.key).split('_');
								_findTargetAndToggleClass(likeUser, likeTarget, cursor.value.checked);
								cursor.continue();
							}
						}
					};				
				}
				_askStep();
			}
		}).fail(() => alert('새로운 문제를 조회할 수 없습니다.'));
	}
	
	// 한 문제 플레이어에 표시
	function _askStep() {
		currentBattle = battlePool.shift();
		selectHistory = [];
		const view = document.getElementById(`battle-${currentBattle.battleType}`);
		// 배틀 타입 표시
		view.querySelector('.battle-type').textContent = currentBattle.battleType;
		
		// 다른 배틀 섹션 숨김
		$(view).show().siblings('.battle-section').hide();
		// 해설 숨김
		$(view).find('.explain-section').hide().find('.collapse').collapse('hide');
		
		const ask = view.querySelector('.ask');
		const sentence = view.querySelector('.sentence');
		const eng = currentBattle.eng;
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let offsetPos = 0, leftStr, options = [];
		const contextChildren = [];
		switch(currentBattle.battleType) {
			case '1' :
				// 질문 표시
				ask.textContent = `다음 문장의 ${currentBattle.ask}를 선택하세요.`;
				// 본문 표시
				examples.forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span', role: 'button', className: 'option', 
						textContent: eng.substring(start, end),
						onclick: function() {
							$(this).toggleClass('selected');
							$(view).find('.js-solve-btn').prop('disabled', sentence.querySelectorAll('.selected').length == 0);
						}
					});
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});
				sentence.replaceChildren(createElement(contextChildren));
				break;
			case '2' :
				// 질문 표시
				if(currentBattle.ask.includes('모든')) {
					ask.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'}를 모두 선택하세요.`;
				}else {
					ask.textContent = `[${currentBattle.ask}] 수식어와 피수식어를 선택하세요.`;
				}
				// 본문 표시
			 	const [ modifiers, modificands ] = answers;
			 	const optionDummy2 = { el: 'span', role: 'button', onclick: function() {
					if(this.matches('.selected')) {
						const searchedIndex = selectHistory.indexOf(this);
						
						(selectHistory.splice(searchedIndex, 1))[0].classList.remove('selected');
						
						// 선택 해제 시 수식어-피수식어 쌍을 선택하는 문제에서는 선택 같이 해제되도록.
						if(!currentBattle.includes('모든')) {
							const pairNum = Math.floor(searchedIndex / 2) * 2 + (1 - searchedIndex % 2);
							const indexToDelete = pairNum > searchedIndex ? searchedIndex : (searchedIndex - 1);
							
							if(selectHistory[indexToDelete]) {
								(selectHistory.splice(indexToDelete, 1))[0].classList.remove('selected');
							}
						}
					}else {
						this.classList.add('selected');
						selectHistory.push(this);
					}
					view.querySelector('.js-solve-btn').disabled = selectHistory.length == 0;
				}}
			 	// answerArr = [[start,end,class],[start,end,class],...] (class: modifier, modificand)
			 	const answerArr = Array.from(modifiers, modifier => modifier.concat('modifier'))
		 						.concat(Array.from(modificands, modificand => modificand.concat('modificand')));
				answerArr.sort(([a], [b]) => a - b).forEach(([ start, end, className ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) {
						if(leftStr.includes(' ')) {
							Array.from(leftStr.split(' ').filter(s => s.length > 0), s => {
								return Object.assign({ className: 'option d-inline-block', textContent: s }, optionDummy2);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(leftStr, ' ');
					}
					contextChildren.push(Object.assign({ className: `${className} d-inline-block`, textContent: eng.substring(start, end) }, optionDummy2));
					if(end < eng.length) contextChildren.push(' ');
					if(j == arr.length - 1 && end < eng.length) {
						if(eng.indexOf(' ', end) > -1) {
							Array.from(eng.substring(end).split(' ').filter(s => s.length > 0), s => {
								return Object.assign({ className: 'option d-inline-block', textContent: s }, optionDummy2);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});
				
				sentence.replaceChildren(createElement(contextChildren));
				break;
			case '3' :
				/* 맞는 어법 찾기.
					example = [[대상start,대상end],정답텍스트,오답텍스트]
					answer = [정답텍스트]
				*/
				const [[ blankStart, blankEnd ], answerText, wrongText ] = examples;
				leftStr = eng.substring(offsetPos, blankStart);
				if(leftStr) contextChildren.push(leftStr);
				options = [answerText, wrongText].sort(() => Math.random() - 0.5);
				contextChildren.push({
					el: 'span',
					className: 'pick-right',
					'data-answer': answerText,
					textContent: `[ ${options.join(' / ')} ]`
				});				
				if(blankEnd < eng.length)
					contextChildren.push(eng.substring(blankEnd));
				sentence.replaceChildren(createElement(contextChildren));	
					
				view.querySelector('.example-btn-section').replaceChildren(
					createElement(Array.from(options, option => {
						return { el: 'button', className: 'btn btn-outline-fico w-100', textContent: option , onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							view.querySelector('.js-solve-btn').disabled = false;
						}};
				})));
				break;
			case '4' :
				/* 틀린 어법 찾기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
					answer = [[정답start,정답end],정답텍스트,오답텍스트]
				 */
				const [[ answerStart, answerEnd ], answer, wrong ] = answers;
				// 보기 표시
				examples.sort(([a], [b]) => a - b).forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					let optionText = eng.substring(start, end);
					const span = {
						el: 'span',
						className: 'option text-decoration-underline', 
						textContent: optionText
					};
					if(answerStart == start && answerEnd == end) {
						span.className = 'answer-wrong text-decoration-underline';
						span.textContent = wrong;
						optionText = wrong;
						span['data-answer'] = answer;
					}
					contextChildren.push(span);
					// 선택지 추가
					options.push({ el: 'button', className: 'btn btn-outline-fico w-100', textContent: optionText, onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							view.querySelector('.js-solve-btn').disabled = false;
						}});
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});		
				sentence.replaceChildren(createElement(contextChildren));		
				view.querySelector('.example-btn-section').replaceChildren(createElement(options));
				break;	
			case '5' :
				/* 배열하기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
				 */
				 
				// 해석 표시
				sentence.replaceChildren(currentBattle.kor)
				// 선택 초기화
				view.querySelector('.arranged-examples').replaceChildren();
				// 보기 표시
			 	examples.sort(() => Math.random() - 0.5).forEach(([ start, end ]) => {
					options.push({ el: 'button', className: 'btn btn-outline-fico mb-1', textContent: eng.substring(start, end), onclick: function() {
						if(!this.closest('.arranged-examples')) {
							view.querySelector('.arranged-examples').appendChild(this);
						}else {
							view.querySelector('.example-btn-section').appendChild(this);
						}
						view.querySelector('.js-solve-btn').disabled = view.querySelector('.arranged-examples').childElementCount == 0;
					}
					});
				});	
				view.querySelector('.example-btn-section').replaceChildren(createElement(options));
				break;
		}
		
		// 배틀 출처 표시
		//view.querySelector('.source').textContent = currentBattle.source;
	}
	
	/** 플레이어 초기화
	 */
	function initPlayer(memberId, age, contentType, contentId) {
		_memberId = memberId;
		_contentId = contentId;
		_contentType = contentType;

		// 나이를 연령대로 변환
		if(age < 13) _ageGroup = 'E';
		else if(age < 16) _ageGroup = 'M';
		else if(age < 19) _ageGroup = 'H';
		else  _ageGroup = 'C';
		
		// 비회원일 경우 로컬에서 기록 탐색
		if(_memberId == 0) {
			req = window.indexedDB.open(DB_NAME, DB_VERSION);
			req.onsuccess = function() {
				idb = this.result;
				const tx = idb.transaction(['FreeMembership','Battle'], 'readonly');
				idbstore = tx.objectStore('Battle');
				// 전체 레코드를 조회
				req = idbstore.openCursor();
				req.onsuccess = function() {
					const cursor = this.result;
					if(cursor) {
						// 레코드에 해당하는 버튼을 찾아 좋아요 표시 클래스를 적용합니다.
						const [likeUser, likeTarget] = atob(cursor.key).split('_');
						_findTargetAndToggleClass(likeUser, likeTarget, cursor.value.checked);
						cursor.continue();
					}
				}
			};
			// 테이블 스키마 변경이 필요할 경우 아래 코드를 변경하세요.
			req.onupgradeneeded = function() {
				idb = this.result;
				idbstore = idb.createObjectStore('Battle');
				idbstore.createIndex('id', 'id', { unique: false});
				idbstore.createIndex('checked', 'checked', { unique: false});
			}
		}
		_getNextBattles();
	}
	
	/** 컨테이너 속에서 지정한 선택자에 해당하는 요소들의 위치 반환
	@param container 부모 html 요소
	@param matcher 선택자
	@returns [[start,end], [start,end],...] start/end: Number
	*/
	function findPositions(container, matcher) {
		let pos = 0, arr = [];
		container.childNodes.forEach(child => {
			const textLength = child.textContent.replaceAll(/[\n\u200b]/gm, '').length;
			if(child.className && (typeof matcher == 'string' ? child.matches(matcher) : (child == matcher))) {
				arr.push([pos, pos + textLength]);
			}
			pos += textLength;
		})
		return arr;
	}
	
	function displayAnswerInfo(eng, explainSection, answerInfo) {

		// 구문분석 정보
		tandem.showSemanticAnalysis(eng, answerInfo.svocTag.svocBytes, $(explainSection).find('.svoc-section').empty());
		// 해석 정보
		explainSection.querySelector('.trans-section').replaceChildren(createElement(Array.from(answerInfo.korList, kor => {
			return { el: 'span', className: 'text-fc-red ms-3', style: 'display: list-item', textContent: kor.kor };
		})));
		
		// 단어 목록 정보
		explainSection.querySelector('.words-section')
		.replaceChildren(createElement(Array.from(answerInfo.wordList, (word, i) => {
			return 	{ "el": "span", "class": `one-word-unit-section${i>0?' ms-3':''}`, "children": [
				{ "el": "span", "class": "title fw-bold text-blue-700", textContent: word.title }].concat(Array.from(word.senseList, sense => {
					return { "el": "span", "class": "one-part-unit-section ms-2", "children": [{ 
						"el": "span", "class": "part text-palegreen", textContent: sense.partType },
						{ "el": "span", "class": "meaning ms-1", textContent: sense.meaning }
					]};
				}))
			}
		})));	
	}	
	
	window['craft'] = Object.assign({}, window['craft'], { initPlayer });
})(jQuery, window, document);

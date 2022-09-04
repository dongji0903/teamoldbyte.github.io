/** 텐덤을 기초로 한 크래프트 배틀 출제를 위한 모듈
 @author LGM
 */
(function craftMaker($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	if(typeof createElement == 'undefined') {
		$.cachedScript('https://static.findsvoc.com/js/util/DOM-util.min.js', {
			success: () => craftMaker($, window, document)
		});
		return;
	}
	
	let staticCraftPanel, craftToolbarGroup = {}, 
		battleAsks = [], battleTypeInfos = [], battleBtns = [], 
		// 문법 카테고리 목록(캐싱)
		categories = [], workbook_battleSource,
		// 체크박스 그룹화를 위한 시퀀스값
		chkbxSeq = 0;
	let _memberId;
	const GRAMMARID_ORDERING = 880000;
	const BATTLE_TYPE_SELECTOR = 'data-battle-type';
	let undoList = [], redoList = []; // 편집 내역
	
	// 크래프트 데이터 초기화(메뉴 구성 및 출제 유형별 정보)
	$.getJSON('https://static.findsvoc.com/data/tandem/craft-toolbar.json', json => {
		craftToolbarGroup = json;
		staticCraftPanel = createElement(json.craftPanel);
		battleAsks = json.battleAsks;
		battleTypeInfos = json.battleTypeInfos;
		battleBtns = json.commonEditorBtns;
	});
	let cachedAskTags = {}, cachedSources = {}, cachedCateAskTagMap = {}; // 검색어 캐시 
		
	let craftToolbar = createElement({
		el: 'div', 
		className: 'btn-toolbar row col-md-3',
		role: 'toolbar'});
	
	//------------------------ [이벤트 할당] --------------------------------------
	$(document)
	// 배틀타입, 난이도, 문법 카테고리 클릭 시 해당하는 배틀 수를 조회한다.
	.on('click', '.battle-type-section .btn, .battle-diffLevel-section .btn, .battle-category-section select', function() {
		let param = {};
		const addSection = this.closest('.add-battle-section');
		let counterSection = addSection.querySelector('.battles-counter-section');
		let statsType;
		if(!counterSection) {
			counterSection = createElement(craftToolbarGroup.battleCounterPanel)
			$.getJSON('/craft/battle/stats/total', total => {
				counterSection.querySelector('.counter-total').textContent = `${total}건`;
			}).fail(() => alert('전체 배틀 갯수를 조회할 수 없습니다.'));
			addSection.querySelector('.battle-type-section').before(counterSection);
		}
		if(this.matches('.battle-type-section .btn')) {
			statsType = 'type';
			const battleType = document.getElementById(this.htmlFor).value;
			param = { battleType };
		}else if(this.matches('.battle-diffLevel-section .btn')) {
			statsType = 'level';
			let diffLevel = document.getElementById(this.htmlFor).value;
			const engLength = addSection.querySelector('.battle-context').textContent.trim().length;
			diffLevel = calcDiffSpecific(diffLevel, engLength);
			param = { diffLevel };
		}else {
			statsType = 'gc';
			const categoryId = parseInt(this.value);
			param = { categoryId };
		}
		$.getJSON(`/craft/battle/stats/${statsType}`, param, function(result) {
			let section;
			switch(statsType) {
				case 'type':
					section = counterSection.querySelector('.counter-same-type');
					section.replaceChildren(createElement(Array.from(result, (count, i) => {
						return [{el: 'label', className: 'bg-fc-yellow col-auto ms-2 rounded-pill', textContent: `#${i + 1}`}, 
								{el: 'span', className: 'col-auto', textContent: `${count}건`}]
					})));
					break;
				case 'level':
					section = counterSection.querySelector('.counter-same-difflevel')
					section.replaceChildren(createElement([
						{ el: 'span', className: 'col-auto', textContent: `${param.diffLevel}: ${result}건`}
					]));
					break;
				case 'gc':
					section = counterSection.querySelector('.counter-same-category')
					section.replaceChildren(createElement(
						{ el: 'span', className: 'col-auto', textContent: `${categories.find(c => c.cid == param.categoryId).title}: ${result}건`}
					));
					break;
			}
			if($.fn.bounce != undefined)
				$(section).bounce();
		}).fail(() => alert('배틀 갯수 조회에 실패했습니다.'));
	})
	// 배틀타입 선택시 에디터 종류를 변경한다.
	.on('change', '.battle-type-section input[type=radio]', function() {
		const semanticResult = $(this).closest('.battle-section-panel').data('semantics');
		
		const makerContainer = this.closest('.add-battle-section').querySelector('.craft-maker-container');
		
		attachBattleMaker(makerContainer, semanticResult, parseInt(this.value));
	})
	// 에디터 메뉴의 질문(ask)을 선택하면 태그(tag) 프리셋값을 설정한다.
	.on('change', '.ask-select', function() {
		const tag = this.querySelector('option:checked').dataset.tag;
		const tagInput = this.closest('.add-battle-section').querySelector('.askTag');
		if(tag) tagInput.value = tag;
		else tagInput.value = '';
	})
	// 문법 카테고리 값을 변경하면 동일 문법에 대한 이전 askTag값을 사용. (내역이 없을 경우 빈 값)
	.on('change', '.battle-category-section select', function() {
		this.closest('.add-battle-section').querySelector('.askTag').value 
		= cachedCateAskTagMap[parseInt(this.value)] || '';
	})
	// 에디터 메뉴 내의 토글아이콘들은 다른 토글아이콘을 체크해제한다.
	.on('change', '.battle-maker [role=toolbar] [type=checkbox]', function() {
		if(!this.checked) {
			return;
		}
		this.closest('[role=toolbar]').querySelectorAll('[type=checkbox]:checked')
		.forEach(el => {
			if(this.compareDocumentPosition(el) != 0) el.checked = false;
		})
		
		const sel = getSelection();
		if(!sel.isCollapsed) {
			wrapText(this.closest('.battle-maker'));
		}
	})
	// 보기 및 정답 요소들은 다시 클릭 시 삭제된다.
	.on('click', '.battle-context *', function() {
		if(this.closest('.battle-maker')) {
			if(this.nodeName == 'SPAN') {
				this.outerHTML = this.innerHTML;
			}else {
				this.remove();
			}
		} 
	})
	// 실행취소 및 재실행 동작
	.on('click', '.battle-maker [value=undo], .battle-maker [value=redo]', function() {
		const isUndo = this.value == 'undo';
		const editHistory = isUndo ? undoList.pop() : redoList.pop();
		const makerDiv = this.closest('.battle-maker');
		const context = makerDiv.querySelector('.battle-context');
		
		(isUndo ? redoList : undoList).push(context.innerHTML);
		context.innerHTML = editHistory;
		$(context).animate({opacity:0.5},100).animate({opacity:1},100);
		
		makerDiv.querySelector('[value=undo]').disabled = undoList.length == 0;
		makerDiv.querySelector('[value=redo]').disabled = redoList.length == 0;
	})
	.on('keyup', function(e) {
		const battleMaker = e.target.closest('.battle-maker');
		if(battleMaker) {
			if(e.ctrlKey && e.key.toUpperCase() == 'Z')
				$(battleMaker).find('[value=undo]').trigger('click');
			else if(e.ctrlKey && e.key.toUpperCase() == 'Y')
				$(battleMaker).find('[value=redo]').trigger('click');
		}
	})
	// 배틀 등록 버튼 클릭시 배틀입력 정보를 커맨드로 취합하여 전송
	.on('click', '.js-add-battle', function() {
		const addSection = this.closest('.add-battle-section');
		const battlePanel = addSection.closest('.battle-section-panel');
		const battleContext = addSection.querySelector('.battle-context');
		const categoryId = parseInt(addSection.querySelector('.battle-category-section select').value);
		
		const battleType = addSection.querySelector('.battle-type-section input:checked').value;
		const diffLevel = addSection.querySelector('.battle-diffLevel-section input:checked').value;
		const ask = addSection.querySelector('.ask-select').value.trim();
		const askTag = addSection.querySelector('.askTag').value.trim();
		const comment = addSection.querySelector('.comment').value.trim();
		const source = addSection.querySelector('.source').value.trim();
		const engLength = battleContext.textContent.trim().length;
		const command = {
			categoryId, battleType, ask, askTag, comment, source, diffLevel, engLength,
			sentenceId: $(battlePanel).data('sentenceId'),
			memberId: _memberId,
			example: '', answer: '',
			diffSpecificLevel: calcDiffSpecific(diffLevel, engLength)
		}
				
		// 배틀 유형별 example, answer 정보 구성.
		switch(battleType) {
			case '1':
				// [보기 위치1, 보기 위치2, ...]
				command.example = JSON.stringify(findPositions(battleContext, '.answer, .option'));
				// [정답 위치]
				command.answer = JSON.stringify(findPositions(battleContext, '.answer'));
				break;
			case '2':
				// [[수식어 위치1, 수식어 위치2, ...], [피수식어 위치1, 피수식어 위치2, ...], ...]
				const modifiers = findPositions(battleContext, '.modifier'),
					modificands = findPositions(battleContext, '.modificand');
				if((modifiers.length || modificands.length) == 0) {
					alert('수식어 혹은 피수식어를 1개 이상 선택해 주세요.')
					return;
				}
				command.answer = JSON.stringify([ modifiers, modificands ]);
				break;
			case '3':
				let blank = battleContext.querySelector('.pick-right');
				if(!blank) {
					alert('문제로 만들 어구를 선택해 주세요.');
					return;
				}
				// [빈칸 위치, 정답 텍스트, 오답 텍스트]
				command.example = JSON.stringify([ findPositions(battleContext, '.pick-right')[0], 
												blank.textContent.trim(), blank.dataset.wrong.trim() ]);
				// [정답 텍스트]
				command.answer = JSON.stringify([ blank.textContent.trim() ]);
				break;
			case '4':
				let wrong = battleContext.querySelector('.answer-wrong');
				if(battleContext.querySelector('.option') == null) {
					alert('보기 어구를 선택해 주세요.');
					return;					
				}
				// [보기 위치1, 보기 위치2, ...]
				command.example = JSON.stringify(findPositions(battleContext, '.option, .answer-wrong'));
				// [정답 위치, 정답 텍스트, 오답 텍스트]
				command.answer = JSON.stringify([ findPositions(battleContext, '.answer-wrong')[0], 
												wrong.textContent.trim(), wrong.dataset.wrong.trim() ]);
				break;
			case '5':
				if(Array.from(battleContext.querySelectorAll('.option'), opt => opt.textContent).join('').replace(/\W/g,'')
				!= battleContext.textContent.replace(/\W/g,'')) {
					alert('보기를 모두 더하면 원문이 되도록 선택해 주세요.');
					return;
				}
				// [보기 위치1, 보기 위치2, ...]
				command.example = JSON.stringify(findPositions(battleContext, '.option'));
				// select에서 한글해석 선택
				command.ask = addSection.querySelector('.select-kor').value;
				break;
			default: break;
		}
		
		// (ajax) 배틀 등록
		$.ajax({
			url: '/craft/battle/add',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(command),
			success: function(response) {
				// 태그 캐시 갱신
				pushToCache(askTag, cachedAskTags);
				// 출처 캐시 갱신
				pushToCache(source, cachedSources);
				// 카테고리-태그 갱신
				cachedCateAskTagMap[categoryId] = askTag;
				
				if(!document.getElementById('craftResultModal')) {
					document.body.appendChild(createElement(craftToolbarGroup.addResultModal));
				}
				$('#craftResultModal .battle-id').text(response.battleId);
				$('#craftResultModal .group-count').text(response.groupCount);
				$('#craftResultModal').modal('show');
				
				
				// 워크북 내에서 등록한 경우 배틀 출처 기본값 지정.
				if(!workbook_battleSource && command.source.length > 0 && window.location.pathname.startsWith('/workbook/passage')) {
					workbook_battleSource = command.source;
				}
				
				battleContext.replaceChildren(battleContext.textContent);
				
				command.battleId = response.battleId;
				command.grammarTitle = categories.find(c => c.cid == categoryId).title;
				const battleList = battlePanel.querySelector('.existing-battles-section');
				const newBattle = previewBattle($(battlePanel).data('eng'), command);
				let battleGroupBtn = battleList.querySelector(`[${BATTLE_TYPE_SELECTOR}="${battleType}"]`);
				let battleGroupBlock;
				// 유형 그룹이 없을 경우
				if(!battleGroupBtn) {
					// 문장에서의 첫 등록
					if(!battleList.querySelector(`[${BATTLE_TYPE_SELECTOR}]`)) {
						// 배틀 미등록 문구 삭제
						battleList.replaceChildren();
					}
					const randId = Date.now() + 1;
					[battleGroupBtn, battleGroupBlock] = makeExistingBattle(battleType,1,randId,[]);
					battleGroupBtn = createElement(battleGroupBtn);
					battleGroupBlock = createElement(battleGroupBlock);
					battleList.append(battleGroupBtn);
					$(battleGroupBtn).css('height',0).animate({height:'100%'}, 500, function() { this.style.height = 'auto';});
					// 유형 그룹 추가
					battleList.append(battleGroupBlock)
				}
				else {
					// 기존 유형 그룹에 추가
					const battleCountBlock = battleGroupBtn.querySelector('.battle-count');
					battleCountBlock.textContent = parseInt(battleCountBlock.textContent) + 1;
					battleGroupBlock = document.querySelector(battleGroupBtn.dataset.bsTarget);
				}
				const newBattleBlock = createElement(newBattle)
				battleGroupBlock.append(newBattleBlock);
				$(newBattleBlock).css('display','none').slideDown()
			},
			error: function(err) {
				alert(err);
			}
		})
	})
	// 배틀 삭제
	.on('click', '.js-delete-battle', function() {
		const battleBlock = this.closest('.battle-preview-one');
		const battlesBlock = battleBlock.closest('.battle-preview')
		const battleGroupBtn = battlesBlock.previousElementSibling;
		const battleId = battleBlock.dataset.id;
		$.post(`/craft/battle/del/${battleId}`, function() {
			alert('배틀이 삭제되었습니다.');
			battleBlock.remove();
			const counter = battleGroupBtn.querySelector('.battle-count');
			const decreased = parseInt(counter.textContent) - 1;
			if(decreased > 0) {
				counter.textContent = decreased; 
			}else {
				battlesBlock.remove();
				battleGroupBtn.remove();
			}
		}).fail(() => alert('배틀 삭제에 실패했습니다.'))
	})
	/** 배틀 출제 패널을 컨테이너에 삽입
	 */
	function openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList) {
		if(!$.fn.autocomplete) {
			document.head.append(createElement(
				[{el: 'link', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.css'},
				{el: 'link', rel: 'stylesheet', href: 'https://static.findsvoc.com/css/app/craft-maker.min.css'}]));
			// 배틀 태그(askTag)의 제시어 기능을 위해 jquery-ui 사용
			// jquery-ui와 부트스트랩의 tooltip 함수 충돌 때문에 
			// 부트스트랩 메소드를 임시 저장한 채로 jquery-ui모듈을 로드한 후 원상복구
			const _tooltip = $.fn.tooltip;
			$.cachedScript('https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', {
				success: () => {
					$.fn.tooltip = _tooltip;
					openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList);
				}
			});
			return;
		}
		// 카테고리 화면에서 최초 1회 불러오기
		const categorySection = staticCraftPanel.querySelector('.battle-category-section select');
		if(categories.length == 0) {
			$.getJSON('/grammar/category/list', results => {
				categories = results;
				let elements = Array.from(categories, c => {
					return { el:'option', value: c.cid,
						textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
				})
				categorySection.append(createElement(elements));
				openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList);
			});
			return;
		}
		_memberId = memberId;
		const sentenceEng = tandem.cleanSvocDOMs(semanticsDiv).innerText;
		
		// 공용 패널 복사본으로 패널 새로 생성
		let panelInstance = staticCraftPanel.cloneNode(true);
		// 전달받은 인자값들을 패널 요소에 접근하여 얻을 수 있도록 설정
		$(panelInstance).data('semantics', semanticsDiv)
						.data('sentenceId', sentenceId)
						.data('eng', sentenceEng)
						.data('transList', transList);
						
		// 패널 내의 라디오버튼들에 유니크한 이름 설정(다른 패널들과 동작이 겹치지 않도록)
		const now = Date.now();
		panelInstance.querySelectorAll('[data-radio]')
			.forEach((radioGroup, i) => {
				const radioName = `${radioGroup.dataset.radio}${now}${i}`
				radioGroup.querySelectorAll('input[type=radio]').forEach((radio, j) => {
					radio.name = radioName;
					radio.id = `${radioName}${j}`;
					radio.nextElementSibling.htmlFor = `${radioName}${j}`;
				})
		});
		
		// 문장에 등록된 배틀 조회
		$.getJSON(`/craft/battle/search/${sentenceId}`, battles => {
			let battleSummary = {}; // 타입별 배열로 저장(1: [a,b,c], 2: [d,e,f], ...)
			battles.forEach(battle => {
				if(battleSummary[battle.battleType] == null) 
					battleSummary[battle.battleType] = [];
				battleSummary[battle.battleType].push(battle);
			});
			const battleListSection = panelInstance.querySelector('.existing-battles-section');
			// 이전 배틀 목록 비우기
			battleListSection.replaceChildren();
			if(Object.entries(battleSummary).length == 0) {
				battleListSection.append('등록된 배틀이 없습니다.');
			}else {
				Object.entries(battleSummary).forEach((summ, i) => {
					const randId = Date.now() + i;
					battleListSection.append(createElement(
						makeExistingBattle(summ[0], summ[1].length, randId, 
							Array.from(summ[1], battle => previewBattle(sentenceEng, battle)))));
				})
			}
		})
		
		container.replaceChildren();
		// 배틀 1 유형을 기본으로 에디터 지정
		attachBattleMaker(panelInstance.querySelector('.craft-maker-container'), semanticsDiv, 1);
		container.append(panelInstance);
		
		// 배틀 생성탭이 처음 나올 때 askTag값 임의 지정
		$(panelInstance).find('.ask-select').trigger('change');
		
		// 배틀 태그(askTag)에 제시어 기능 적용
		// 배틀 출처(source)에 제시어 기능 적용
		$(panelInstance).find('.askTag, .source').each(function() {
			const ajaxURL = `/craft/battle/${this.matches('.askTag') ? 'tag' : 'source'}/search/{}`;
			const cacheList = this.matches('.askTag') ? cachedAskTags : cachedSources;
			$(this).autocomplete({
				minLength: 1, delay: 50, source: function(req, res) {
					const term = req.term && req.term.trim();
					if(term in cacheList) {
						res(cacheList[term]);
						return;
					}
					$.getJSON(ajaxURL.replace('{}',term), function(data) {
						if(data.length > 0) cacheList[term] = data.sort();
						res(data);
					}).fail(() => {
						res([]);
					})
				}
			})
		})
		if(workbook_battleSource) {
			panelInstance.querySelector('input.source').value = workbook_battleSource;
		}
	}
	
	
	/** 배틀 문제 생성.
	@param container 에디터가 들어갈 div
	@param semanticsDiv 문제 대상 .semantics-result
	@param battleType 배틀 유형(1,2,3,4,5)
	 */
	function attachBattleMaker(container, semanticsDiv, battleType) {
		container.replaceChildren();
		redoList = []; undoList = [];
		const makerDiv = createElement({el: 'div', className: 'battle-maker row', tabIndex: 0})
		container.append(makerDiv);	
		let asks = battleTypeInfos[battleType - 1];
		// 1, 2 유형의 경우 대상 문장에 포함된 성분들 파악해서 질문 목록에서 우선표시
		if([1,2].includes(battleType)) {
			asks.forEach(el => {
				if(el.selector != null && semanticsDiv.querySelector(`.sem${el.selector}`) != null )
					el.recommended = true;
			});
			asks.sort((a,b) => {
				if(!a.recommended) return 1;
				return b.recommended ? 0 : -1;
			})
		}
		// 배틀 유형별 툴바 표시
		appendToolbar(battleType, makerDiv);
		
		// 문장 길이에 따라 난이도 선택을 제한( engLength > 80: 중↑, engLength > 150: 상)
		const engLength = semanticsDiv.textContent.length;
		//makerDiv.querySelector('.battle-level-select[value="A"]').disabled = engLength > 80;
		//makerDiv.querySelector('.battle-level-select[value="B"]').disabled = engLength > 150;
		
		makerDiv.querySelector('.battle-level-select[value="B"]').checked = engLength > 80;
		makerDiv.querySelector('.battle-level-select[value="C"]').checked = engLength > 150;
		
		// 배틀 유형별 질문 표시
		appendAskSelect(battleType, asks, makerDiv);
		if([1,2].includes(battleType)) {
			const selectedAsk = makerDiv.closest('.add-battle-section').querySelector('.ask-select');
			$(selectedAsk).trigger('change');
		}			
		// 수정 영역 표시
		appendContext(semanticsDiv, makerDiv);		
	}
	
	/** 주어진 버튼 그룹을 툴바에 넣어서 에디터에 탑재
	 */
	function appendToolbar(battleType, maker) {
		const btnGroup = craftToolbarGroup[`battle${battleType}`]
		craftToolbar.innerHTML = '';
		appendClassifiedElement(btnGroup, craftToolbar);
		for(let i = 0, len = battleBtns.length; i < len; i++) {
			appendClassifiedElement(battleBtns[i], craftToolbar);
		}
		maker.prepend(craftToolbar.cloneNode(true));
		
		const now = Date.now();
		const levelBtns = {el: 'div', className: 'battle-diffLevel-section col-12 col-md-3 row',
			children: [
				{el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '난이도'}
			]
		};
		[{text: '쉬움', value: 'A'},{text: '보통', value: 'B'},{text: '어려움', value: 'C'}]
		.forEach(function(level, i) {
			levelBtns.children.push({el: 'input', type: 'radio', autocomplete: 'off',
				name: `btnRadioBattleLevel${now}`,
				id: `btnRadioBattleLevel${now}${i}`,
				className: 'btn-check battle-level-select', 
				checked: i == 0, value: level.value});
			levelBtns.children.push({el: 'label', textContent: level.text,
				htmlFor: `btnRadioBattleLevel${now}${i}`,
				className: 'col btn col-auto px-4 ms-1 rounded-pill btn-outline-fico'});
		})
		appendClassifiedElement(levelBtns, maker);
		
		const categorySelect = maker.closest('.add-battle-section').querySelector('.battle-category-section select')
		if(battleType == 5) {
			// 5유형의 배틀은 '어순'을 기본 문법 카테고리로 선택
			categorySelect.value = GRAMMARID_ORDERING;
			$(categorySelect).trigger('click');
			// 5유형의 배틀은 해석을 선택하는 영역을 추가(ask로 지정됨)
			maker.append(createElement({
				el: 'div', className: 'col-12 col-md-3 row',
				children: [
					{el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '해석'},
					{el: 'select', className: 'select-kor form-select d-inline-block col',
					children: Array.from($(maker).closest('.battle-section-panel').data('transList'), (trans, i) => {
						return {el: 'option', value: trans.id, textContent: `${i+1}번째 해석`}
					})}
				]
			}))
		}
		// 3,4,5 유형은 askTag을 먼저 비움
		if(battleType > 2) {
			$(categorySelect).trigger('change');
		}
	}
	/** 주어진 질문 목록을 에디터에 설정
	@param battleType 배틀 유형 1,2,3,4,5
	@param askArray 질문 목록 [{selector, tag, recommended}]
	 */
	function appendAskSelect(battleType, askArray, maker) {
		const json = {
			el: 'div', 
			className: 'col-12 col-md-3 row',
			children: [
				{	el: 'label', textContent: '질문', 
					className: 'col-auto lh-1 my-auto text-fc-purple fw-bold'
				}
			]				
		};
		const select = {
			el: 'select', 
			className: 'form-select ask-select col', 
			children: []
		};
		askArray.forEach((one, i) => {
			const option = {el: 'option'};
			if(one.recommended) option.className = 'bg-fc-light-purple';
			option.value = one.tag || `#${battleType}`;
			if(one.tag) option['data-tag'] = one.tag
			option.innerHTML = battleAsks[battleType - 1].replace('{}',one.tag);
			if(i == 0) option.selected = true;
			select.children.push(option);
		});
		json.children.push(select);
		maker.prepend(createElement(json));
	}
	/** 구문분석 div로부터 원문 텍스트를 추출하여 에디터 본문으로 삽입
	 */
	function appendContext(semanticsResult, maker) {
		appendClassifiedElement({
			el: 'div', className: 'row pe-2', children: [
				{el: 'label', className: 'col-auto lh-1 my-auto text-white fw-bold', textContent: '본문'},
				{el: 'div', className: 'battle-context fs-5 bg-white mt-3 px-2 col form-control',
					textContent: tandem.cleanSvocDOMs(semanticsResult).innerText, onmouseup: () => wrapText(maker)}
			]}, maker);
	}
	/** BattleMaker 내부에 선택된 텍스트를 span으로 감싸고 에디터에서 선택된 메뉴에 따라 클래스 지정
	 */
	function wrapText(maker) {
		let sel = getSelection();
		// 에디터에서 선택된 메뉴버튼
		const chkdBtn = maker.querySelector('[role=toolbar] [type=checkbox]:checked');
		
		const REGEX_NOT_WHITESPACE_PUNCT = /[^\s,.!?;:…]/,
			REGEX_STARTSWITH_WHITESPACE_PUNCT = /^(\s|[,.!?;:…])/,
			REGEX_ENDSWITH_WHITESPACE_PUNCT = /(\s|[,.!?;:…])$/,
			REGEX_SHORT_VERB = /('m|'re|'s|'d|'ll|'ve)$/;
		if(!sel.isCollapsed && chkdBtn) {
			const context = maker.querySelector('.battle-context');
			if(sel.toString().trim() == context.textContent.trim()
			|| !(8 & sel.anchorNode.compareDocumentPosition(context)
				 & sel.focusNode.compareDocumentPosition(context))) return;
			
			const battleType = parseInt(maker.closest('.add-battle-section').querySelector('.battle-type-section input:checked').value);
			
			// 배틀 3,4 유형에 정답을 두 개 이상 선택하려는 경우 취소 
			if([3,4].includes(battleType) && chkdBtn.value.match(/pick-right|answer-wrong/) && context.getElementsByClassName(chkdBtn.value).length > 0) {
				alert('이 유형의 배틀은 복수 정답을 허용하지 않습니다.\n기존 정답을 눌러 지워 주세요.');
				return;
			}
			
			/* 선택 범위를 단어 단위로 선택되도록 자동 조절. 선택범위의 양끝 공백은 제거
				배틀 1, 3 유형은 띄어쓰기가 아닌 apostrophe를 기준으로 범위를 지정할 수도 있어서 예외
			*/
			// 드래그 선택 방향이 오른쪽->왼쪽이라면 방향을 뒤집는다.(아래의 로직 전개를 위해)
			if(sel.anchorNode.compareDocumentPosition(sel.focusNode) == 2
			|| (sel.anchorNode.compareDocumentPosition(sel.focusNode) == 0
			&& sel.anchorOffset > sel.focusOffset)) {
				sel.setBaseAndExtent(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
			}
			// 왼쪽에 선택할 글자가 있다면 추가선택
			while(sel.anchorOffset > 0 
			&& sel.anchorNode.textContent.charAt(sel.anchorOffset).match(REGEX_NOT_WHITESPACE_PUNCT)
			&& sel.anchorNode.textContent.charAt(sel.anchorOffset -1).match(REGEX_NOT_WHITESPACE_PUNCT)
			&& (![1,3].includes(battleType) || !sel.toString().trim().match(REGEX_SHORT_VERB))) {
				sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset - 1, sel.focusNode, sel.focusOffset);
			}
			// 왼쪽 끝이 공백이거나 구두점이면 왼쪽 범위를 축소
			while(sel.toString().match(REGEX_STARTSWITH_WHITESPACE_PUNCT)) {
				sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset + 1, sel.focusNode, sel.focusOffset);
			}
			// 오른쪽에 선택할 글자가 있다면 추가선택
			while( sel.focusOffset < sel.focusNode.textContent.length - 1
			&& sel.focusNode.textContent.charAt(sel.focusOffset - 1).match(REGEX_NOT_WHITESPACE_PUNCT) 
			&& sel.focusNode.textContent.charAt(sel.focusOffset).match(REGEX_NOT_WHITESPACE_PUNCT)
			&& (![1,3].includes(battleType) || !(sel.focusNode.textContent.length > 2 
					&& sel.focusNode.textContent.substring(sel.focusOffset, sel.focusOffset + 3).trim().match(REGEX_SHORT_VERB)))) {
				sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset + 1);
			}
			// 오른쪽 끝이 공백이거나 구두점이면 오른쪽 범위를 축소
			while(sel.toString().match(REGEX_ENDSWITH_WHITESPACE_PUNCT)) {
				sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset - 1);
			}
			if(sel.toString().trim().length == 0) return;
			
			pushEditHistory(context);
			
			const wrapper = document.createElement('span');
			wrapper.className = chkdBtn.value;
			const range = sel.getRangeAt(0);
			
			wrapper.textContent = range.extractContents().textContent;
			range.insertNode(wrapper);
			sel.removeAllRanges();
			
			if(chkdBtn.value.match(/pick-right|answer-wrong/)) {
				const wrong = prompt(`${wrapper.textContent}의 오답을 입력하세요.`);
				if(wrong) {
					wrapper.dataset.wrong = wrong;
				}else {
					$(wrapper.firstChild).unwrap();
				}
			}
		} 		
	}
	
	/** 배틀 조회 목록에 추가할 '유형명&갯수 표시','상세보기목록' json을 반환.
	createElement()를 사용해야 DOM화 할 수 있음.
	 */
	function makeExistingBattle(battleType, groupCount, randId, battlePreviews) {
		const viewId = `existingBattleView${randId}`;
		return [{
				el: 'div', className: 'js-open-existing-battle d-inline-block btn border', role: 'button',
				'data-battle-type': battleType,
				'data-bs-toggle': 'collapse','data-bs-target': `#${viewId}`,
				children: [
					`Battle #${battleType}: `,
					{el: 'span', className: 'battle-count', textContent: groupCount}, 
					' 건 ',
					{ el: 'span', className: 'fold-icon text-xl align-middle' }
				]
		},
		{// 배틀 상세 정보
			el: 'div', id: `existingBattleView${randId}`,
			className: 'battle-preview fade collapse',
			children: battlePreviews
		}];
	}
	
	/** json 정보를 바탕으로 버튼 태그를 생성하여 삽입.
	버튼그룹 및 툴팁, 라벨 자동 적용.
	@param json 버튼을 포함한 태그 정보
	@param parent 태그가 삽입될 부모 요소
	 */
	function appendClassifiedElement(json, parent) {
		modifyJson(json, v => {
			// div에 클래스명이 없을 경우 버튼그룹으로 적용
			if(!v.className && v.el == 'div')
				v.className = 'btn-group col-auto';
			// 체크박스는 아니지만 title이 있다면 툴팁으로 적용
			else if(v.title && v.type != 'checkbox') {
				v['data-toggle'] = 'tooltip';
				v['data-placement'] = 'bottom';
			}
			return v;
		})
		
		const element = createElement(json);
		// 체크박스들은 토글버튼형태로 보이도록 라벨 추가 지정
		// json에서는 객체 추가가 어렵기 때문에 DOM 생성 후 진행
		element.querySelectorAll('[type=checkbox]').forEach(chkbx => {
			if(!chkbx.className) chkbx.className = 'btn-check';
			const chkbxId = `btn-check-${chkbxSeq++}`;
			chkbx.id = chkbxId;
			const label = createElement({el: 'label', htmlFor: chkbxId,
				className: 'btn btn-outline-fico', textContent: chkbx.textContent});
			if(chkbx.title) { // 체크박스에 지정된 title은 라벨을 위해 있는 것
				label.title = chkbx.title;
				label.dataset.toggle = 'tooltip';
				label.dataset.placement = 'bottom';
			}
			chkbx.after(label);
		})
		parent.append(element);
	}	

	function modifyJson(json, fn) {
		if(Array.isArray(json)) {
			json.forEach((v,i) => json[i] = modifyJson(v, fn));
		}
		else if(typeof json == 'object') {
			Object.entries(json).forEach(([key, value]) => {
				if(value && Array.isArray(value))
					value.forEach((v,i) => value[i] = modifyJson(v, fn));
				json[key] = value;
			});
		}
		return fn.apply(this, [json]);
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
			if(child.className && child.matches(matcher)) {
				arr.push([pos, pos + textLength]);
			}
			pos += textLength;
		})
		return arr;
	}
	/** 요소들을 등장 순서에 따라 정렬
	 */
	function sortByPosition(a, b) {
		return a[0] - b[0];
	}
	
	/** battle json 정보를 통해 createElement() 파라미터용 json 반환
	@param eng battle의 원문 Sentence 텍스트 정보
	@param battle battle정보를 담은 JSONObject
	 */
	function previewBattle(eng, battle) {
		const answers = JSON.parse(battle.answer||"[]");
		const examples = JSON.parse(battle.example||"[]");
		let offsetPos = 0;
		const contextChildren = [];
		if(battle.battleType == '1') {
		/* 성분 찾기. 
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
			answer = [[정답1start,정답1end],[정답2start,정답2end],...]
		*/ 
			examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: (answers.find(a => a[0] == example[0] && a[1] == example[1])) ? 'answer' : 'option', 
					textContent: eng.substring(example[0],example[1])
				});
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}else if(battle.battleType == '2') {
		/* 수식어 찾기.
			answer = [[[수식어start,수식어end],[수식어start,수식어end],...],[[피수식어start,피수식어end],[피수식어start,피수식어end],...]]
		 */
		 	const [ modifiers, modificands ] = answers;
		 	// answerArr = [[start,end,class],[start,end,class],...]
		 	const answerArr = Array.from(modifiers, modifier => modifier.concat('modifier'))
	 						.concat(Array.from(modificands, modificand => modificand.concat('modificand')));
			answerArr.sort(sortByPosition).forEach((answer, j, arr) => {
				let leftStr = eng.substring(offsetPos, answer[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: answer[2], 
					textContent: eng.substring(answer[0],answer[1])
				});
				if(j == arr.length - 1 && answer[1] < eng.length) {
					contextChildren.push(eng.substring(answer[1]));
				}
				offsetPos = answer[1];
			});
		}else if(battle.battleType == '3') {
		/* 맞는 어법 찾기.
			example = [[대상start,대상end],정답텍스트,오답텍스트]
			answer = [정답텍스트]
		*/
			let leftStr = eng.substring(offsetPos, examples[0][0]);
			if(leftStr) contextChildren.push(leftStr);
			contextChildren.push({
				el: 'span',
				className: 'pick-right',
				'data-wrong': examples[2],
				textContent: eng.substring(examples[0][0],examples[0][1])
			});				
			if(examples[0][1] < eng.length)
				contextChildren.push(eng.substring(examples[0][1]));
		}else if(battle.battleType == '4') {
		/* 틀린 어법 찾기.
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
			answer = [[정답start,정답end],정답텍스트,오답텍스트]
		 */
			examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				const span = {
					el: 'span',
					className: 'option', 
					textContent: eng.substring(example[0],example[1])
				};
				if(answers[0][0] == example[0] && answers[0][1] == example[1]) {
					span.className = 'answer-wrong';
					span['data-wrong'] = answers[2];
				}
				contextChildren.push(span);
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}else if(battle.battleType == '5') {
		/* 배열하기.
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
		 */
		 	examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: 'option', 
					textContent: eng.substring(example[0],example[1])
				});
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}
		const preview = {
			el: 'div', 'data-id': battle.battleId,
			className: 'battle-preview-one m-1 ms-5 bg-light border border-2 px-2', 
			children: [
				{
					el: 'div', className: 'row', children: [
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '질문:'},
							{el: 'span', textContent: battleAsks[battle.battleType - 1].replace('{}',battle.askTag)}
						]},
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '난이도:'},
							{el: 'span', textContent: battle.diffLevel}
						]},
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '문법:'},
							{el: 'span', textContent: battle.grammarTitle}
						]}
					]
				},
				{
					el: 'div', className: 'battle-context pb-3', 
					children: contextChildren
				}
			]
		};
		if(_memberId == battle.memberId)
			preview.children.push({el: 'div', children: [
				{el: 'button', className: 'btn btn-sm btn-fico js-delete-battle', textContent: '삭제'}
				]
			})
		return preview;
	}
	
	// 컨텍스트의 html을 통째로 보관
	function pushEditHistory(context){
		undoList.push(context.innerHTML);
		redoList = [];
		context.closest('.battle-maker').querySelector('[role=toolbar] [value="undo"]').disabled = false;
	}
	
	/** 키워드를 캐시에 추가, 캐시를 정렬
	 */
	function pushToCache(keyword, cacheList) {
		if(keyword.length > 0) {
			for(let i = 0, len = keyword.length; i < len; i++) {
				for(let j = i + 1; j <= len; j++) {
					const term = keyword.substring(i, j);
					if(!(term in cacheList)) 
						cacheList[term] = [];
					if(!cacheList[term].includes(keyword))
						cacheList[term].push(keyword);
					cacheList[term].sort();
				}
			}
		}
	}
	
	// 문장 난이도(E,N,D)와 문장길이로 상세난이도 반환
	function calcDiffSpecific(diffLevel, engLength) {
		let diffSpecificLevel;
		if(diffLevel == 'A') {
			if(engLength <= 30) {
				diffSpecificLevel = '이병';
			}else if(engLength <= 60){
				diffSpecificLevel = '일병';
			}else diffSpecificLevel = '병장';
		}else if(diffLevel == 'B') {
			if(engLength <= 50) {
				diffSpecificLevel = '하사';
			}else if(engLength <= 70) {
				diffSpecificLevel = '상사';
			}else if(engLength <= 100) {
				diffSpecificLevel = '소위';
			}else if(engLength <= 120){
				diffSpecificLevel = '대위';
			}else diffSpecificLevel = '소령';
		}else if(diffLevel == 'C') {
			if(engLength <= 150) {
				diffSpecificLevel = '대령';
			}else if(engLength <= 200) {
				diffSpecificLevel = '준장';
			}else {
				diffSpecificLevel = '소장';
			}
		}
		return diffSpecificLevel;
	}
	
	window['craft'] = Object.assign({}, window['craft'], { openBattleMakerPanel, });
})(jQuery, window, document);

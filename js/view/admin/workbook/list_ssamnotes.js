/** admin/workbook/list_ssamnotes.html
 * @author LGM
 */
function pageinit(memberId, memberAlias, memberImage){
	const svocSectionJson = {
		el: 'div', className: 'svoc-section row position-relative', children: [
			{ el: 'div', className: 'svoc-block col my-auto' },
			{ el: 'div', className: 'svoc-mdf-btns btn-group px-2', children: [
					{ el: 'button', 'data-seq': '', 
						className: 'js-edit-svoc login-required btn text-bluegray-300 p-0 pe-1',
						'data-toggle': 'tooltip', title: '분석 수정', children: [
							{ el: 'span', className: 'fas fa-marker'}
						]
					},
					{ el: 'button', 'data-seq': '', 
						className: 'js-del-svoc login-required btn text-bluegray-300 p-0 ps-1',
						'data-toggle': 'tooltip', title: '분석 삭제', children: [
							{ el: 'span', className: 'fas fa-trash-alt'}
						]
					}
				]
			},
			{ el: 'div', className: 'writer-section col-12 col-md-1 mt-2 mt-xl-0 btn', 'data-bs-toggle': 'collapse' , children: [
				{ el: 'div', className: 'personacon-alias alias text-truncate' }
			]}
		]
	};
	const noteSectionJson = {
		el: 'div', className: 'note-block one-block row g-0', children: [
			{ el: 'div', className: 'note text-section', children: [
				{ el: 'div', className: 'note-text', textContent: '노트 본문' },
				{ el: 'div', className: 'note-editor', style: 'display: none;', children: [
					{ el: 'textarea', className: 'text-input col-12' },
					{ el: 'div', className: 'form-check form-switch d-inline-block mx-1', children: [
						{ el: 'label', className: 'form-check-label text-sm', role: 'button', children: [
							{ el: 'input', type: 'checkbox', className: 'open-input form-check-input', checked: false },
							'회원들과 노트를 공유합니다.'
						]}
					]},
					{ el: 'button', type: 'button', className: 'btn p-0', 'data-bs-toggle': 'modal', 'data-bs-target': '#note-modal', children: [
						{ el: 'span', className: 'material-icons-outlined fs-6', textContent: 'help_outline' }
					]},
					{ el: 'div', className: 'note-edit-btns btn-group btn-set float-end mt-0 mt-sm-2', children: [
						{ el: 'button', type: 'button', className: 'js-edit-note-cancel btn btn-sm btn-outline-fico', textContent: '취소' },
						{ el: 'button', type: 'button', className: 'js-edit-note btn btn-sm btn-fico', textContent: '확인' }
					]}
				]}
			]},
			{ el: 'div', className: 'col-12 personacon-section text-end mt-1 text-secondary fst-italic', children: [
				'written by ',
				{ el: 'div', className: 'personacon-alias alias d-inline fst-normal' }
			]},
			{ el: 'div', className: 'col-auto ms-auto row mh-2rem', children: [
				{ el: 'div', className: 'col-auto ms-auto me-1 note-mdf-btns btn-group', children: [
					{ el: 'button', type: 'button', 
						className: 'js-edit-note-open login-required btn border-color-bluegray border-2 border-end-0 rounded-start py-0 pe-0 text-bluegray-300',
						'data-toggle': 'tooltip', title: '노트 수정', children: [
							{ el: 'span', className: 'far fa-file-alt' },
							{ el: 'span', className: 'fas fa-pen fa-xs', style: {
								left: '-8px', top: '5px', position: 'relative'
							}}
						]
					},
					{ el: 'button', type: 'button', 
						className: 'js-delete-note login-required btn border-color-bluegray border-2 rounded-end py-0 fas fa-trash-alt text-bluegray-300',
						'data-toggle': 'tooltip', title: '노트 삭제'
					}
				]},
				{ el: 'div', className: 'updatedate col-auto ms-auto p-0 mt-1 text-secondary text-xs' }
			]}
		]
	};

	const transModifyBtnsJson = {
		el: 'div', className: 'trans-mdf-btns', children: [
			{ el: 'button', type: 'button', className: 'js-edit-trans-open login-required btn btn-sm py-0 pe-0 pt-0',
				'data-toggle': 'tooltip', title: '해석 수정', children: [
					{ el: 'span', className: 'material-icons fs-5', textContent: 'edit' }
				]
			},
			{ el: 'button', type: 'button', className: 'js-del-trans login-required btn btn-sm py-0',
				'data-toggle': 'tooltip', title: '해석 삭제', children: [
					{ el: 'span', className: 'material-icons fs-5', textContent: 'delete' }
				]
			}
		]
	}
	const transEditorJson = {
		el: 'div', className: 'trans-editor mt-2', children: [
			{ el: 'textarea', className: 'text-input form-control' },
			{ el: 'div', className: 'trans-edit-btns btn-group my-2', children: [
				{ el: 'button', type: 'button', className: 'js-edit-trans-cancel btn btn-sm btn-outline-fico', textContent: '취소' },
				{ el: 'button', type: 'button', className: 'js-edit-trans login-required btn btn-sm btn-fico', textContent: '확인' }
			]}
		]
	}	
	const $transCopyBlock = $('.ai-translation-block');
	const $wordCopySection = $('.one-word-unit-section');
	const $partCopySection = $('.one-part-unit-section');			
	let selectedRow;  
	$(document).on('click', '.js-open-detail', function() {
		const sentenceId = this.dataset.sid;
		selectedRow = this.closest('tr');
		$(selectedRow).addClass('bg-info')
		.siblings('tr').removeClass('bg-info');
					
					
		const $unitSection = $('.one-sentence-unit-section');			
		$unitSection.find('.s-id').text(sentenceId);
		
		$unitSection.addClass('loading');
		$.getJSON(`/adminxyz/workbook/sentence/${sentenceId}`, sentenceInfo => {
			showSentenceDetail(sentenceInfo, $unitSection);
			$unitSection.removeClass('loading').addClass('loaded');
		});
		// 워크북 정보 조회
		$.getJSON(`/adminxyz/workbook/info/${sentenceId}`, workbookInfo => {
			showWorkBookInfo(workbookInfo, $unitSection);
		})		
	});

	// 탭 설정
	$('.one-sentence-unit-section').find('[role="tab"]').each(function() {
		const tabType = this.dataset.type;
		this.dataset.bsTarget = '#sentence0' + ' .' + tabType + '-section';
		const tabTrigger = new bootstrap.Tab(this);
		const $tabBtn = $(this);
		const $target = $(this.dataset.bsTarget);
		$tabBtn.on('click', e => { 
			e.preventDefault();
			if(!$tabBtn.is('.active')) {
				tabTrigger.show();
			}else{
				$target.collapse('hide');
			}
		}).one('shown.bs.tab', function() {
           $target.find('.afterload').fadeIn(300);
		}).on('shown.bs.tab', function() {
			$target.collapse('show');
		}).on('hidden.bs.tab', function() {
			$target.removeClass('show');
		});
		$target.on('hidden.bs.collapse', function(e) {
			// collapse 이벤트는 부모까지 전파되므로 자기 자신에게 일어난 이벤트인지 확인.
			if(e.target != $target.get(0)) return;
			$target.removeClass('active');
			$tabBtn.removeClass('active').attr('aria-selected', false).blur();
		})
	});
	
	$(document).on('shown.bs.collapse', '.one-sentence-unit-section>.collapse', function(e) {
		// 문장/구문분석이 펼쳐지면 구문분석 스타일 새로고침
		if(e.target.matches('.removable-section') && e.target == e.currentTarget) {
			$(e.target).find('.semantics-result').filter(':visible').each(function() {
				tandem.correctMarkLine(this);
			});
			$(e.target).find('.dashboard-section').show(0).trigger('show.bs.collapse');
		}
		
	})
	// 평가 대시보드 펼치기
	.on('show.bs.collapse', '.dashboard-section', function() {
		$(this).prev('.result-semantic-section').addClass('border-bottom-0');
	}).on('hidden.bs.collapse', '.dashboard-section', function() {
		$(this).prev('.result-semantic-section').removeClass('border-bottom-0');
	})
	// [분석 결과 평가]------------------------------------------------------------
	const checkModalContents = {'S': '<b>평가를 하는 이유</b><br><br>A.I.는 인간의 언어를 이해하면서 분석하지 않습니다.<br>학습자들에게 도움이 될 수 있도록 분석 결과를 평가해주세요.<br>평가도 하고 다양한 fico Egg도 모아보세요.',
								'F': '<b>AI 분석이 정확하지 않은가요?</b><br><br>그건 회원님이 AI보다 실력이 좋다는 증거입니다.<br>직접 수정할 수도 있고 그냥 내버려 둘 수도 있습니다.<br>실력 발휘 기대합니다.'};
	const resultStatusMap = {'S': {icon: '🥳', status: 'S', tooltip: '평가를 받은 문장이예요.'},
							'F': {icon: '🤯', status: 'F', tooltip: '분석이 틀렸대요.'} };
	// 분석 평가 모달을 띄운 버튼에 따라 모달 속 내용 설정(문장정보, metaStatus)
	$('#check-modal').on('show.bs.modal', function(e) {
		const modalBtn = e.relatedTarget.closest('button');
		const submitBtn = this.querySelector('.status-submit');
		const metaStatus = modalBtn.dataset.metaStatus;
		submitBtn.dataset.metaStatus = metaStatus;
		this.querySelector('.modal-body').innerHTML = checkModalContents[metaStatus];
		$(submitBtn).data('sentenceSection', $(modalBtn.closest('.one-sentence-unit-section')));
	});	
	// 분석 평가 제출
	$('#check-modal .status-submit').on('click', function() {
		const $sentence = $(this).data('sentenceSection');
		const metaStatus = this.dataset.metaStatus;
		const $statusIcon = $sentence.find('.dashboard-section .meta-status');
		// metaStatus 저장(ajax)-------------------------------------------------
		tandem?.meta?.submitMetaStatus($sentence.data('sentenceId'), metaStatus, 'workbook', () => {
			metaStatusCallback($statusIcon, resultStatusMap[metaStatus]);
		});
		// ---------------------------------------------------------------------
		$('#check-modal').modal('hide');
	})
	function metaStatusCallback($statusIcon, resultStatus) {
		let contentChanged = false;
		// 실행했던 버튼은 비활성화
		$statusIcon.closest('.dashboard-section')
			.find('.edit-meta-status-btn[data-meta-status]').each(function() {
				if(!this.disabled) {
					const disabledWrapper = $(this).prop('disabled', true)
						.wrap('<span data-bs-original-title="이미 평가한 문장입니다."></span>')
						.parent()[0];
					new bootstrap.Tooltip(disabledWrapper, {trigger: 'hover focus'}).enable();
					disabledWrapper.querySelector('.material-icons').className = 'material-icons text-gray-400';
				}
			})
		// 평가 완료 문구 표시
		const $completeMsg = $statusIcon.next();
		$completeMsg.popover('show');
		setTimeout(() => $completeMsg.popover('dispose'), 3000);
		// 평가결과 이모티콘 변화
		anime({
			targets: $statusIcon[0],
			rotateX: 360,
			scale: [
				{value: 3, duration: 500, easing: 'easeOutBack'},
				{value: 1, duration: 2500, easing: 'easeInBounce'}
			],
			delay: 300,
			duration: 3000,
			update: function(anim) {
				// 회전하는 도중 바뀐 metaStatus을 아이콘에 적용
				if(!contentChanged && anim.progress > 20) {
					$statusIcon.text(resultStatus.icon).attr('data-bs-original-title', resultStatus.tooltip);
					contentChanged = true;
				}
			},
			complete: function() {
				$statusIcon[0].style.transform = '';
			}
		})
	}	
	
	// [문장의 번역 영역 펼치고 접기]------------------------------------------------------- 
	$(document).on('click', '.open-kor-btn,.ai-translation-section', function() {
		const $transSection = $(this).closest(".translation-section");
		const $elements = $transSection.find(".ai-translation-block:not(:first)");
		const $foldBtn = $transSection.find('.open-kor-btn');
		$elements.collapse($foldBtn.is('.active') ? 'hide' : 'show');
		$foldBtn.find('.fold-icon').toggleClass('expanded',!$foldBtn.is('.active')); 
		$foldBtn.toggleClass('active');
	})
	
	// [분석 결과 접기/펼치기]-------------------------------------------------------
	$('.js-collapse-svoc').click(function(){
		$(this).closest('.one-sentence-unit-section')
				.find('.result-semantic-section .collapse').collapse('toggle');
		$(this).toggleClass('expanded');
	})
	
	// [분석 결과 추가/편집]--------------------------------------------------------
	$(document).on('click', '.js-add-svoc, .js-edit-svoc', async function() {
		let forNew = $(this).is('.js-add-svoc');
		$('.js-add-svoc').prop('disabled', true);
		
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		let $semantics = null;
		if(forNew) {
			// 분석 추가일 경우 최상위 분석을 복사한 폼을 생성
			var $newSection = $(createElement(svocSectionJson)).addClass('new-svoc-form');

			$newSection.find('.personacon-alias').text(memberAlias);
			const $personacon = $('#hiddenDivs .member-personacon').clone(true);
			if(memberImage) {
				const profile = $personacon.find('.personacon-profile')
											.removeClass('profile-default')[0];
				profile.style.background = 'url(/resource/profile/images/'
									+ memberImage + ') center/cover no-repeat';
			}
			$newSection.find('.writer-section').prepend($personacon);			
			
			const text = $sentenceSection.find('.origin-sentence .sentence-text').text();
			const svocBytes = await tandem.getSvocBytes($sentenceSection.find('.semantics-result').get(0));
			
			$sentenceSection.find('.result-semantic-section').prepend($newSection);
			$semantics = $(await tandem.showSemanticAnalysis(text, svocBytes, $newSection.find('.svoc-block')));
			$semantics.data('memberId', memberId);
			$newSection.find('.svoc-mdf-btns').hide().find('[data-seq]')
						.attr('data-seq', $semantics.attr('data-seq'));
		}else {
			// 분석 수정일 경우 현재 분석 폼에 에디터 적용
			$semantics = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
			$(this).closest('.svoc-mdf-btns').hide();
		}
		
		// 에디터 열기----------------------------------------------
		$semantics.svoceditor(forNew, saveFunc, cancelCallback);
		// -------------------------------------------------------
		setTimeout(() => {
			tandem.correctMarkLine($semantics[0])
		}, 500);
		// 편집 저장 실행
		function saveFunc(svocText) {
			const sentenceId = parseInt($semantics.closest('.one-sentence-unit-section').data('sentenceId'));
			const ownerId = parseInt(selectedRow.dataset.ownerId);
			const svocId = parseInt($semantics.data('svocId') || 0);
			const svocCommand = {sentenceId, ownerId, memberId, encSvocText: svocText};
			
			if(memberId == Number($semantics.data('memberId')) && svocId > 0) {
				svocCommand.svocId = svocId;
			}
			// 편집 저장(ajax)-------------------
			editSvoc(svocCommand, successSave);
			// --------------------------------
			// gramMeta도 같이 저장(ajax)---------------------------------------
			window['tandem']?.meta?.saveGramMetaFromDOM(sentenceId, $semantics[0], true, 'workbook');
			// --------------------------------------------------------------
			metaStatusCallback($semantics.closest('.one-sentence-unit-section').find('.meta-status'),resultStatusMap['S']);
		}
		
		// 편집 저장 콜백(신규 분석 표식 해제 및 svocId 할당. 분석 접기/펼치기 대상 재정의)
		function successSave(newSvocId) {
			if(forNew && newSvocId != null) {
				$semantics.closest('.new-svoc-form').removeClass('new-svoc-form');
				$semantics.data('svocId', newSvocId);
				$sentenceSection.find('.js-collapse-svoc').addClass('expanded').show();
				$semantics.closest('.svoc-section').nextAll('.svoc-section').collapse('show');
			}
			$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
		}
		
		// 편집 취소(분석 조작 버튼 재활성화, 신규 추가폼 삭제)
		function cancelCallback() {
			$('.js-add-svoc').prop('disabled', false);
			if(forNew) {
				$semantics.closest('.new-svoc-form').remove();
			}else {
				$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
			}
		}
	})
	// [구문분석 삭제]-------------------------------------------------------------
	.on('click', '.js-del-svoc', function() {
		const $result = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
		const $sentenceSection = $result.closest('.one-sentence-unit-section');
		const svocId = Number($result.data('svocId'));
		if(confirm('삭제하시겠습니까?')) {
			// 구문분석 삭제(ajax)-------------
			delSvoc(svocId, successDelSvoc);
			//------------------------------
		}
		// 삭제된 분석 화면에서 제거
		function successDelSvoc() {
			$result.closest('.svoc-section').fadeOut(() => {
				$result.closest('.svoc-section').remove();
				// 남은 구문분석이 1개면 접기/펼치기 버튼 숨김
				if($sentenceSection.find('.svoc-section').length < 2) {
					$sentenceSection.find('.js-collapse-svoc').hide();
				}
				// 접기/펼치기 대상 변경
				$sentenceSection.find('.svoc-section:first-child').removeClass('collapse show');
				$sentenceSection.find('.svoc-section:not(:first-child)').addClass('collapse');
			});
		}
	});
	
	// [나의 해석 수정]------------------------------------------------------------
	const $transEditor = $(createElement(transEditorJson));
	$(document).on('click', '.js-edit-trans-open', function(){
		let $transBlock = $(this).closest('.ai-translation-block');
		if($transBlock.length > 0){
			$transBlock.find('.trans-mdf-btns, .translation-text').hide();
			$transEditor.find('.text-input').val($transBlock.find('.translation-text').text());
		}else{
			$transBlock = $(this).closest('.translation-section');
			$transEditor.find('.text-input').val(null);
		}
		$transBlock.append($transEditor);
		
	}).on('click', '.js-edit-trans', function(){
		const _this = this, $transBlock = $(this).closest('.ai-translation-block');
		const sentenceId = Number($(this).closest('.one-sentence-unit-section').data('sentenceId')), 
			kor = $('.trans-editor .text-input').val().trim();
		const $transSection = $(_this).closest('.translation-section');
		let jsonCommand = {sentenceId, memberId, kor};
		if($transBlock.data('korTid') != null) {
			jsonCommand.korTid = Number($transBlock.data('korTid'));
		}
		if(kor.length == 0) return;
		// 문장 해석 추가/수정(ajax)-------------------------
		editSentenceTrans(jsonCommand, successEditTrans);
		// ----------------------------------------------

		function successEditTrans(tid){
			if($transBlock.length > 0){
				$transBlock.find('.translation-text').text(kor);
				$transBlock.find('.trans-mdf-btns, .translation-text').show();
			}else{
				const $newTrans = $transCopyBlock.clone();
				$newTrans.data('korTid', tid).find('.translation-text').text(kor);
				$newTrans.find('.translator').text('by ' + memberAlias);
				$newTrans.append(createElement(transModifyBtnsJson));
				
				$transSection.find('.ai-translation-section').prepend($newTrans);
				$newTrans.addClass('show');
				if(!$transSection.find('.open-kor-btn').is('.active')) {
					$newTrans.siblings('.ai-translation-block').removeClass('show');
				}
			}
			$('.trans-editor').appendTo('#hiddenDivs');
		}
	})
	.on('click', '.js-edit-trans-cancel', function(){
		const $transBlock = $(this).closest('.ai-translation-block');
		$('.trans-editor').appendTo('#hiddenDivs');
		$transBlock.find('.trans-mdf-btns, .translation-text').show();
	})
	// [나의 해석 삭제]------------------------------------------------------------
	.on('click', '.js-del-trans', function(){
		const $transBlock = $(this).closest('.ai-translation-block');
		if(confirm('삭제하겠습니까?')){
			// 문장 해석 삭제(ajax)----------------------------------------------
			delSentenceTrans(Number($transBlock.data('korTid')), successDel);
			// ---------------------------------------------------------------
		}
		
		function successDel() {
			alert('삭제되었습니다.');
			$transBlock.next('.ai-translation-block')?.collapse('show');
			$transBlock.remove();
		}
	})
	// [문장의 노트 목록 가져오기(1회)]------------------------------------------------
	.on('show.bs.tab', '.one-sentence-unit-section .nav-link[data-type=note]', async function(){
		const $nav = $(this);
		const $sentenceSection = $(this).closest('.one-sentence-unit-section'); 
		const workbookId = $sentenceSection.data('workbookId');
		const sentenceId = $sentenceSection.data('sentenceId');
		const $noteSection = $(this.dataset.bsTarget);
		
		
		if($(this).is('.loading,.loaded')) return;
		$(this).addClass('loading');
		$noteSection.find('.empty-list').show();
		// 문장의 노트 새로 가져오기(ajax)-------------------------------------
		await $.getJSON(`/workbook/sentence/note/list/${workbookId}/${sentenceId}/${memberId}`, notes => listNotes(notes))
		.fail( () => alert('노트 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//---------------------------------------------------------------
		
		function listNotes(notes){
			// 노트가 있으면 목록 표시
			if(notes.length > 0 ) {
				$noteSection.find('.empty-list').hide();
			}
			const $noteList = $noteSection.find('.note-list').empty();
			for(let i = 0, notesLen = notes.length; i < notesLen; i++) {
				const note = notes[i];
							   //------------------
				const $block = createNoteDOM(note);
							   //------------------
				$block.appendTo($noteList);
			}
			$nav.toggleClass('loading loaded');
		}
	})
	// [문장의 노트 추가]-----------------------------------------------------------
	.on('click', '.js-add-sentence-note-btn', function() {
		const $sentenceSection = $(this).closest('.one-sentence-unit-section'); 
		const sentenceId = Number($sentenceSection.data('sentenceId'));
		const workbookId = Number($sentenceSection.data('workbookId'));
		const $addSection = $(this).closest('.add-section');
		const content = $addSection.find('.text-input').val().trim();
		const publicOpen = $addSection.find(':checkbox').is(':checked');
		if(content.length == 0) return;
		
		// 문장 노트 추가(ajax)----------------------------------------------------
		addSentenceNote({workbookId, sentenceId, memberId, content, publicOpen}, appendNote);
		//----------------------------------------------------------------------
		
		function appendNote(note) {
			note['memberInfo'] = {memberId, alias: memberAlias};
			const $noteList = $sentenceSection.find('.note-section>.note-list');
			 			   //------------------
			const $block = createNoteDOM(note);
						   //------------------
			$block.prependTo($noteList);
			$addSection.find('.text-input').val('').summernote('destroy');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.note-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}
	})
	// [문장의 질문 목록 가져오기(1회)]-----------------------------------------------
	.one('show.bs.tab', '.one-sentence-unit-section .nav-link[data-type=qna]', function() {
		const $_this = $(this);
		const $sentenceSection = $_this.closest('.one-sentence-unit-section'); 
		const sentenceId = $sentenceSection.data('sentenceId');
		const $qnaSection = $(this.dataset.bsTarget);
		const $qnaList = $qnaSection.find('.qna-list');
		
		if($_this.is('.loading')) return;
		$_this.addClass('loading');
		$qnaSection.find('.empty-list').show();
		// 문장의 질문목록 새로 가져오기(ajax)----------------------------------
		$.getJSON(['/qnastack/question/workbook/sentence',workbookId,sentenceId].join('/'), 
					questions => listQuestions(questions))
		.fail( () => alert('질문 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//---------------------------------------------------------------
		
		function listQuestions(questions){
			// 질문이 있으면 목록 표시
			if(questions.length > 0 ) {
				$qnaSection.find('.empty-list').hide();
			}
			for(let i = 0, questionsLen = questions.length; i < questionsLen; i++) {
				const question = questions[i];
								  //--------------------------------
				const $question = createQuestionDOM(question, false);
								  //--------------------------------
				$question.find('.accordion-collapse')
					 	.attr('data-bs-parent', 
					 		'#' + $sentenceSection.attr('id')+' .qna-list');							
				$qnaList.append($question);
			}
			$_this.removeClass('loading');
		}
	})
	// [문장 질문 등록]----------------------------------------------------------------
	.on('submit', '.sentence-qna-add-form', function(e) {
		e.preventDefault();
		const $addSection = $(this).closest('.add-section'); 
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		const title = $addSection.find('.q-title').val().trim();
		const $content = $addSection.find('.text-input');
		const content = $content.val().trim();
		const command = {
				targetId: Number($sentenceSection.data('sentenceId')),
				qtype: 'S', workbookId, passageId, questionerId: memberId, priorityId,
				title, content
		}
		// 질문 등록(ajax)-------------------------
		addQuestion('workbook', command, successAddQuestion);
		//---------------------------------------
		
		function successAddQuestion(question) {
			const $qnaList = $sentenceSection.find('.qna-section>.qna-list');
							  //-------------------------------
			const $question = createQuestionDOM(question, true);
							  //-------------------------------
			$question.find('.accordion-collapse')
				 	.attr('data-bs-parent', 
				 		'#'+$sentenceSection.attr('id')+' .qna-list');							  
			$qnaList.prepend($question);
			$content.val('');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.qna-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}
	})
	
/* -------------------------------- 지문/문장 공통------------------------------ */
	
	// [지문/문장의 노트 수정 폼 열기]-------------------------------------------------
	.on('click', '.js-edit-note-open', async function() {
		const $noteSection = $(this).closest('.note-block')
		const $textSection = $noteSection.find('.text-section');
		$noteSection.find('.note-mdf-btns').hide();
		const $content = $textSection.find('.note-text').hide();
		const $noteEditor = $textSection.find('.note-editor').show();
		const $summernote = $noteEditor.find('.text-input').val($content.html());
		$textSection.find('.open-input').trigger('input');
		// 문장 노트일 경우
		if($(this).closest('.passage-comment-section').length == 0){
			// Summernote 에디터 설정------
			openSummernote($summernote);
			// -------------------------
		}
	})
	// [지문/문장의 노트 수정 폼 닫기]------------------------------------------------
	.on('click', '.js-edit-note-cancel', function() {
		const $textSection = $(this).closest('.text-section');
		const $noteSection = $(this).closest('.note-block');
		
		$textSection.find('.note-editor, .note-text')
					.add($noteSection.find('.note-mdf-btns')).toggle();
	})
	// [지문/문장의 노트 수정 완료]---------------------------------------------------
	.on('click', '.js-edit-note', function() {
		const $textSection = $(this).closest('.text-section');
		const $noteSection = $(this).closest('.note-block');
		const $sentenceSection = $textSection.closest('.one-sentence-unit-section');
		const noteId = Number($noteSection.data('noteId'));
		const workbookId = Number($sentenceSection.data('workbookId'));
		const publicOpen = $textSection.find('.open-input').is(':checked');
		const content = $textSection.find('.text-input').val().trim();
		const jsonCommand = {noteId, workbookId, memberId, content, publicOpen}
		const ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
		
		if(content.length == 0) return;
		// 문장 노트일 경우
		if($sentenceSection.length > 0) {
			jsonCommand.sentenceId = Number($sentenceSection.data('sentenceId'));
		}// 지문 노트일 경우
		else {
			jsonCommand.passageId = passageId;
		}

		// 노트 수정(ajax)-------------------------------
		editNote(ofWhat, jsonCommand, successEditNote);
		// --------------------------------------------
		
		function successEditNote(note) {
			$textSection.find('.note-editor').hide();
			$textSection.find('.open-input').prop('checked', note.publicOpen);
			$textSection.find('.note-text').html(note.content).show();
			$noteSection.find('.updatedate').text(new Date().toLocaleDateString());
			$noteSection.find('.note-mdf-btns, .updatedate').show();
		}
	})
	// [지문/문장의 노트 삭제]-------------------------------------------------------
	.on('click', '.js-delete-note', function() {
		if(confirm('삭제하시겠습니까?')){
			// 노트 삭제
			const $noteBlock = $(this).closest('.note-block'),
				$noteSection = $noteBlock.closest('.note-section'),
				noteId = Number($noteBlock.data('noteId')),
				$sentenceSection = $noteBlock.closest('.one-sentence-unit-section'),
				ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
			
			// 노트 삭제(ajax)--------------------
			delNote(ofWhat, noteId, delCallback);
			// ---------------------------------
			function delCallback() {
				$noteBlock.fadeOut(function() {
					$(this).remove();
					if($noteSection.find('.note-block').length == 0){
						$noteSection.find('.empty-list').show();
					}
				})
			}
		}
	})
	// [지문/문장 노트 추가 폼 열기]--------------------------------------------
	.on('click', '.note-section .add-icon', async function(){
		const _this = this;
		const $sentenceUnit = $(_this).closest('.one-sentence-unit-section');
		const sentenceId = $sentenceUnit.data('sentenceId');
		const workbookId = $sentenceUnit.data('workbookId');
		// 피코쌤 노트 상태값 먼저 변경하고, 상태값 변경에 성공 후 편집기 펼치기
		$.ajax({
			url: `/adminxyz/workbook/sentence/note/status/${workbookId}/${sentenceId}`,
			success: (failMsg) => {
				if(!failMsg) {
					$('#ssamNoteRequestListDiv tr.bg-info .status-text').text('작성중');
					openSsamNoteEditor();
				} else if(failMsg.includes('<html')) {
					confirmModal('로그인 시간이 만료되었습니다.\n다시 로그인하시겠습니까?', () => {
						location.assign('/auth/login');
					});
				} else {
					alertModal(failMsg);
				}
			},
			error: () => {
				alertModal('상태를 조회할 수 없습니다.');
			}
		})
	
	
		function openSsamNoteEditor() {
			$(_this).prop('disabled', true);
			const $section = $(_this).closest('.note-section');
			const $addSection = $section.find('.add-section');
			// 문장 노트 추가
			if($(_this).closest('.passage-comment-section').length == 0) 
				// Summernote 에디터 세팅--------------------------
				openSummernote($addSection.find('.text-input'));
				// ---------------------------------------------
			$addSection.show(300, function() {
				$section.find('.empty-list').hide();
			});
		}
		
	})
	// [지문/문장 노트 공개여부 메세지 토글]
	.on('input', '.open-input', function() {
		this.nextSibling.data = this.checked ? '회원들과 노트를 공유합니다.'
											: '노트를 비공개로 보관합니다.'
	})
	// [지문/문장 노트 추가 폼 닫기]----------------------------------------------------
	.on('click', '.cancel-add-note-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $summernote = $addSection.find('.text-input').val('');
		if(typeof $summernote.summernote == 'function') {
			$summernote.summernote('destroy');
		}
		$addSection.hide(300, function() {
			const $noteSection = $addSection.closest('.note-section');
			$noteSection.find('.add-icon').prop('disabled', false);
			if($noteSection.find('.note-list .note-block').length == 0 ){
				$noteSection.find('.empty-list').show();
			}
		});
	})
	// [지문/문장 질문 추가 폼 열기]--------------------------------------------------
	.on('click', '.qna-section .add-icon', async function() {
		$(this).prop('disabled', true).tooltip('hide');
		const $section = $(this).closest('.qna-section');
		const $addSection = $section.children('.add-section');

		if($(this).closest('.passage-comment-section').length > 0) {
			// Summernote 에디터 세팅--------------------------
			openSummernote($addSection.find('.text-input'));
			// ---------------------------------------------
			$addSection.show(300, function() {
				$section.find('.empty-list').hide();
			});
		}else {
			$addSection.show(300, async function() {
				$section.find('.empty-list').hide();
				// Svoc 구문분석 복사 --------------------------
				const $sentenceSection = $section.closest('.one-sentence-unit-section'); 
				const $svocBlock = $addSection.find('.svoc-block');
	
				if($svocBlock.children().length > 0) return;
				const text = $sentenceSection.find('.origin-sentence .sentence-text').text();
				const svocBytes = await tandem.getSvocBytes($sentenceSection.find('.semantics-result').get(0));

				$semantics = $(await tandem.showSemanticAnalysis(text, svocBytes, $svocBlock));
				
				$addSection.find('textarea').get(0).focus();
			});
		}
	})
	// [지문/문장의 질문 추가 폼 닫기]------------------------------------------------
	.on('click', '.cancel-add-qna-btn', function() {
		const $addSection = $(this).closest('.add-section');
		$addSection.find('.svoc-block').empty();
		$addSection.find('.text-input').val('');

		$addSection.hide(300, function() {
			const $qnaSection = $addSection.closest('.qna-section');
			$qnaSection.find('.add-icon').prop('disabled', false);
			if($qnaSection.find('.qna-list .qna-block').length == 0 ) {
				$qnaSection.find('.empty-list').show();
			}
		});
		// 추가질문의 경우 답변 평가지 닫기
		$(this).closest('.survey-section')?.find('.js-satisfy-cancel')?.trigger('click');
	})
	// [질문 수정폼 열기]-----------------------------------------------------------
	.on('click', '.js-edit-question-open', function() {
		const $question = $(this).closest('.question-section'),
		$contentSection = $question.find('.text-section').slideUp(),
		$editSection = $question.find('.edit-section').slideDown(),
		$qnaUnit = $question.closest('.qna-unit');
		// 제목
		$editSection.find('.q-title').val($qnaUnit.find('.title-block .question-text:eq(0)').text());
		// 내용
		$editSection.find('.text-input').val($qnaUnit.data('content'));
		// Summernote 에디터 설정---------------------------
		openSummernote($editSection.find('.text-input'));
		//-----------------------------------------------
	})
	// [질문 수정폼 닫기]-----------------------------------------------------------
	.on('click', '.cancel-edit-question', function() {
		const $editSection = $(this).closest('.edit-section');
		const $contentSection = $editSection.closest('.question-section').find('.text-section');
		$editSection.find('.text-input').val('').summernote('destroy');
		$editSection.slideUp();
		$contentSection.slideDown();
	})
	// [질문 수정 완료]------------------------------------------------------------
	.on('submit', '.question-section .edit-section', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $editSection = $(this).closest('.edit-section');
		const $qnaUnit = $editSection.closest('.qna-unit');
		const title = $editSection.find('.q-title').val().trim();
		const content = $editSection.find('.text-input').val();
		
		if(content.length == 0){
			alert('내용을 입력해 주세요.');
			return false;
		}else {
			const questionCommand = {
				questionId: $qnaUnit.data('questionId'), title, content, 
				targetId: $qnaUnit.data('targetId'), 
				workbookId, passageId,
				qtype: $qnaUnit.data('qType'), questionerId: memberId,
				priorityId: $qnaUnit.data('priorityId'),
				questionStatus: $qnaUnit.data('qStatus')
			}
			
			// 질문 수정(ajax)--------------------------------------------
			editQuestion('workbook', questionCommand, successEditQuestion);
			//----------------------------------------------------------
			
			function successEditQuestion(question) {
				$editSection.find('.text-input').val('').summernote('destroy');
				$editSection.slideUp();
				$qnaUnit.find('.question-section .text-section').slideDown();
				
				// 질문 제목
				$qnaUnit.find('.title-block .question-text:eq(0)')
						.html(question.title.replace('[추가질문]',
								'<span class="text-violet">[추가질문]</span>'));
				// 질문 내용
				$qnaUnit.find('.title-block .question-section .question-text')
						 .text($('<div></div>').html(question.content).text());
				$qnaUnit.find('.content-block .question-text').html(question.content);
			}	
		}
	})
	// [질문 삭제]----------------------------------------------------------------
	.on('click', '.js-del-question', function() {
		const $qnaUnit = $(this).closest('.qna-unit');
		
		if(confirm('질문을 정말 삭제하시겠습니까?')) {
			const questionId = $qnaUnit.data('questionId');
			// 질문 삭제(ajax)-----------------------------
			delQuestion('workbook', questionId, successDel);
			//-------------------------------------------
			
			function successDel(question) {
				alert('삭제되었습니다.');
				if(typeof question != 'object' || question == null) {
					$qnaUnit.slideUp(function() {
						$(this).closest('.qna-block').remove();
					});
				}else {
					// 질문 제목
					$qnaUnit.find('.title-block .question-text:eq(0)').text(question.title);
					// 질문 내용
					$qnaUnit.find('.title-block .question-section .question-text')
							 .text($('<div></div>').html(question.content).text());
					$qnaUnit.find('.content-block .question-text').html(question.content);
					// 질문 상태(완료)
					expressQstatus($qnaUnit.find('.q-status'), 'C');
				}
			}
		}
	})	
	// [지문/문장의 질문 답변 목록 가져오기]-----------------------------------------------
	.on('show.bs.collapse', '.qna-list .content-block', async function() {
		const $contentBlock = $(this);
		const $qnaSection = $(this).closest('.qna-unit');
		const questionId = $qnaSection.data('questionId');
		const qType = $qnaSection.data('qType');
		const targetId = $qnaSection.data('targetId');
		
		if($contentBlock.is('.loading,.loaded')) return;
		if(!$contentBlock.is('.loaded')) { 
			$contentBlock.addClass('loading');
		}
			
		// 질문 답변 목록 가져오기(ajax)------------------------------------------
		$.getJSON(['/qnastack/answers',qType,questionId,targetId].join('/'), 
					{from: 'w'}, listAnswers)
		.fail(jqXHR => {
			alert('질문의 상세내용을 가져오지 못했습니다. 다시 접속해 주세요.');
			$contentBlock.removeClass('loading');
		});
		//-------------------------------------------------------------------
		
		async function listAnswers(answerInfo) {
			const answerList = answerInfo.answerList;
			const $questionSection = $contentBlock.find('.question-section');
			const $insertPos = $contentBlock.find('.answer-list');
			const showList = [$questionSection];
			
			// 질문이 펼쳐지면서 편집버튼 표시(자기 질문일 경우)
			$questionSection.find('.qna-mdf-btns').show();
			
			// 답변 표시
			if(answerList?.length > 0) {
				for(let i = 0, len = answerList.length; i < len; i++) {
					const answer = answerList[i];
										   //----------------------------------
					const $answerSection = createAnswerDOM(answer, $qnaSection);
										   //----------------------------------
					$answerSection.appendTo($insertPos);
					showList.push($answerSection);
				}
			}else { // 답변이 없을 때
				
			}
			for(let i = 0, len = showList.length; i < len; i++) {
				await sleep(600);
				showList[i].addClass('show');
			}
			$contentBlock.toggleClass('loading loaded');
		}
	})
	// [답변 추가 폼 열기]----------------------------------------------------------
	.on('click', '.qna-unit .add-section .text-input', function() {
		// Summernote 에디터 세팅--
		openSummernote($(this));
		//----------------------
		$(this).closest('.add-section').find('.qna-add-btns').slideDown();
	})
	// [답변 추가 폼 닫기]----------------------------------------------------------
	.on('click', '.cancel-add-answer-btn', function() {
		const $addSection = $(this).closest('.add-section');
		
		$addSection.find('.text-input').val('').summernote('destroy');
		$(this).closest('.qna-add-btns').slideUp();
	})
	// [답변 추가 등록]------------------------------------------------------------
	.on('click', '.js-add-answer-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $qnaSection = $addSection.closest('.qna-unit');
		const $input = $addSection.find('.text-input');
		const content = $input.summernote('code').trim();
		
		if(content.length == 0) {
			alert('내용을 입력해 주세요.');
			return false;
		}
		const command = {questionId: Number($qnaSection.data('questionId')),
						writerId: memberId, content};
		// 답변 등록(ajax)---------------------
		addAnswer(command, successAddAnswer);
		//-----------------------------------
		
		function successAddAnswer(answer) {
			$input.val('').summernote('destroy');
			$addSection.find('.qna-add-btns').slideUp();
								   //----------------------------------
			const $answerSection = createAnswerDOM(answer, $qnaSection);
								   //----------------------------------
			$answerSection.insertBefore($addSection);
			sleep(600);
			
			$answerSection.addClass('show');
		}
	})	
	// [답변 수정폼 열기]-----------------------------------------------------------
	.on('click', '.js-edit-answer-open', function() {
		$answer = $(this).closest('.answer-section');
		$contentSection = $answer.find('.text-section').slideUp();
		$editSection = $answer.find('.edit-section').slideDown();
		// 내용
		$editSection.find('.text-input').val($answer.find('.answer-text').html());
		// Summernote 에디터 설정---------------------------
		openSummernote($editSection.find('.text-input'));
		//-----------------------------------------------		
	})
	// [답변 수정폼 닫기]-----------------------------------------------------------
	.on('click', '.cancel-edit-answer', function() {
		const $editSection = $(this).closest('.edit-section');
		const $contentSection = $editSection.closest('.answer-section').find('.text-section');
		$editSection.find('.text-input').val('').summernote('destroy');
		$editSection.slideUp();
		$contentSection.slideDown();
	})
	// [답변 수정 완료]------------------------------------------------------------
	.on('submit', '.answer-section .edit-section', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $editSection = $(this);
		const $answer = $editSection.closest('.answer-section');
		const $contentSection = $answer.find('.text-section');
		const $qnaUnit = $answer.closest('.qna-unit');
		const content = $editSection.find('.text-input').val().trim();
		
		if(content.length == 0) {
			alert('내용을 입력해 주세요.');
			return false;
		}
		const command = {questionId: Number($qnaUnit.data('questionId')),
						answerId: $answer.data('answerId'),
						writerId: memberId, content};
		// 답변 수정(ajax)-----------------
		editAnswer(command, successEdit);
		//-------------------------------
		
		function successEdit(answer) {
			alert('수정되었습니다.');
			$editSection.find('.text-input').val('').summernote('destroy');
			$editSection.add($contentSection).slideToggle();
			$answer.find('.answer-text').html(answer.content);
		}
	})
	// [답변 삭제]----------------------------------------------------------------
	.on('click', '.js-del-answer', function() {
		const $answer = $(this).closest('.answer-section');
		
		if(confirm('답변을 정말 삭제하시겠습니까?')) {
			const answerId = $answer.data('answerId');
			// 답변 삭제(ajax)----------------
			delAnswer(answerId, successDel);
			//------------------------------
			
			function successDel() {
				alert('삭제되었습니다.');
				$answer.slideUp(function() {
					$(this).remove();
				});
			}
		}		
	})	
	// [특정 답변을 선택하여 평가지 펼치기]--------------------------------
	.on('click', '.js-survey-answer', function() {
		const $btnGroup = $(this).closest('.satis-btns').addClass('active');
		$btnGroup.closest('.qna-unit').find('.satis-btns').not($btnGroup).addClass('inactive');
		const $surveySection = $(this).closest('.qna-unit').find('.survey-section').show();
		$surveySection.closest('.content-block').children('.add-section').hide();
		$surveySection.data('answerId', $(this).closest('.answer-section').data('answerId'))
					  .data('memberId', $(this).closest('.answer-section').data('memberId'));
		$surveySection.find('[name=evaluation][value='+$(this).val()+']')
					  .prop('checked',true).trigger('input');
		$surveySection[0].scrollIntoView();
	})
	// [답변 평가지 닫기]-----------------------------------------------------------
	.on('click', '.js-satisfy-cancel', function() {
		const $surveySection = $(this).closest('.survey-section').slideUp();
		$surveySection.closest('.content-block').children('.add-section').show();
		$(this).closest('.qna-unit').find('.satis-btns').removeClass('active inactive');
	})
	// [체크된 평가에 따른 처리(추가질문 폼 처리)]
	.on('input', ':radio[name=evaluation]', function() {
		if(this.value == 'B') {
			const $addSection = $('.question-add-form').appendTo($(this).closest('.survey-section')).slideDown();
			$addSection.find('.q-title').val('[추가질문] ' + $addSection.closest('.qna-unit').find('.question-text:eq(0)').text());
			$addSection.find('.text-input').val('');
			// Summernote 에디터 세팅--------------------------
			openSummernote($addSection.find('.text-input'));
			// ---------------------------------------------
			$addSection.find('.qna-add-btns').slideDown();
			$(this).closest('.survey-section').children('.answer-survey-btns').slideUp();
		}else {
			$(this).closest('.survey-section').find('.question-add-form .q-title')?.val('');
			if(typeof $.summernote != 'undefined')
				$(this).closest('.survey-section').find('.question-add-form .text-input')?.val('').summernote('destroy');
			$(this).closest('.survey-section').find('.question-add-form')?.hide(300);
			$(this).closest('.survey-section').find('.answer-survey-btns').slideDown();
		}
	})
	// [답변 평가]----------------------------------------------------------------
	.on('click', '.js-satisfy-btn', function() {
		const $surveySection = $(this).closest('.survey-section');
		const answerId = $surveySection.data('answerId');
		const writerId = $surveySection.data('memberId');
		const $question = $(this).closest('.qna-unit');
		const questionId = $question.data('questionId');
		const evaluation = $surveySection.find('[name=evaluation]:checked').val();
		const questionStatus = 'ABD'.indexOf(evaluation) > -1 ? 'C' : 'A';
		const command = {questionId, answerId, writerId, evaluation, questionStatus};
		
		// 답변 평가(ajax)------------------------
		evaluateAnswer(command, successEvalute);
		//--------------------------------------
		
		function successEvalute() {
			alert('평가가 완료되었습니다.');
			$surveySection.slideUp();
			
			// 질문상태 변경
			$question.data('qStatus', questionStatus);
			expressQstatus($question.find('.q-status'), questionStatus);
			// 답변 상태 변경
			const $answer = $question.find('.answer-section').filter(function() {
				return $(this).data('answerId') == answerId;
			});
			$answer.find('.satis-btns').remove();
			if('AB'.indexOf(evaluation) > -1) {
				$answer.find('.answer-text')
					   .before('<div class="material-icons text-yellow-400">emoji_events</div>');
			}
			 if(questionStatus == 'C') {
	            $question.find('.satis-btns').remove();
	         }else {
	            $surveySection.closest('.content-block').children('.add-section').show();
	         }
		}
	})
	// [답변 평가 - 추가적인 질문 완료]-----------------------------------------------
	.on('click', '.js-add-question-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $qnaUnit = $addSection.closest('.qna-unit');
		const $content = $addSection.find('.text-input');
		const title = $addSection.find('.q-title').val().trim();
		const content = $content.val().trim();
		if(content.length == 0) return;
		const questionCommand = {
			targetId: $qnaUnit.data('targetId'), title, content, 
			workbookId, passageId,
			priorityId: $(this).closest('.survey-section').data('memberId'),
			qtype: $qnaUnit.data('qType'), questionerId: memberId
		}

		// 질문 추가(ajax)------------------------------------------
		addQuestion('workbook', questionCommand, successAddQuestion);
		//--------------------------------------------------------
		
		function successAddQuestion(question) {
			const $qnaList = $('.qna-list').show();
			const parentId = $qnaList.closest('[id]').attr('id');
							  //-------------------------------
			const $question = createQuestionDOM(question, true);
							  //-------------------------------
			$question.find('.accordion-collapse')
				 	.attr('data-bs-parent', '#' + parentId + ' .qna-list');							  
			$qnaList.prepend($question);
			$content.val('').summernote('destroy');
			$addSection.hide(300, function() {
				$(this).closest('.qna-add-btns').data('openBtn')?.prop('disabled', false);
			})
			// 추가질문의 경우
			if($addSection.closest('.survey-section').length > 0) {
				$addSection.closest('.survey-section').find('.js-satisfy-btn').trigger('click');
			}
		}			
	})
	// 크래프트 출제 패널 동작
	.on('show.bs.tab', '[role=tab][data-type=craft]', function(e) {
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		$sentenceSection.find('.dashboard-section').collapse('hide');
		const translations = Array.from($sentenceSection.find('.ai-translation-block'), transBlock => {
			return {id: $(transBlock).data('korTid'), text: transBlock.querySelector('.translation-text').textContent}
		})
		if(document.querySelector(this.dataset.bsTarget).querySelector('.battle-section-panel') == null) {
			craft.openBattleMakerPanel(document.querySelector(this.dataset.bsTarget),
				memberId,
				$sentenceSection.data('sentenceId'), 
				$sentenceSection.find('.semantics-result')[0],
				translations);
			const workbookTitle = $sentenceSection.find('.workbook-overview-section .wb-title').text();
			if(workbookTitle != 'HELLO-BOOK') {
				setTimeout(() => {
					document.querySelector(this.dataset.bsTarget).querySelector('.battle-source-section .source').value 
					= workbookTitle;
				}, 1000)
			}
		}
	})	
	
	
/* ------------------------------ Embed functions --------------------------- */
	// 노트 정보를 DOM으로 생성
	function createNoteDOM(note) {
		const $block = $(createElement(noteSectionJson));
		$block.data('noteId', note.noteId);
		const $content = $block.find('.note.text-section');
		// 내용
		$content.find('.note-text').html(note.content);
		// 날짜
		$block.find('.updatedate').text(new Date(note.updateDate||new Date()).toLocaleDateString());
		// 본인 것이 아니면 수정버튼 삭제
		if(memberId != note?.memberInfo?.memberId) {
			$block.find('.note-mdf-btns').remove();
		}else {
			$block.find('.note-editor .open-input')
				  .prop('checked', note.publicOpen).trigger('input');
		}
		const $personacon = $block.find('.personacon-section');
		$personacon.find('.alias').text(note?.memberInfo?.alias);
		return $block;
	}
	// 질문 정보를 DOM으로 생성
	var qSeq = 0;
	function createQuestionDOM(question, isMine) {
		const $question = $('#hiddenDivs .qna-unit').clone();
		const $block = $('<div class="qna-block one-block row g-0 p-0"></div>');
		// Question 정보 설정
		$question.data('questionId', question.qid)
				 .data('qType', question.qtype)
				 .data('qStatus', question.qstatus)
				 .data('priorityId', question.priorityId)
				 .data('targetId', question.targetId)
				 .data('content', question.content)
				 .data('isMine', question.questioner.mid == memberId);
		// 질문 상태
		expressQstatus($question.find('.q-status'), question.qstatus);
		// 질문자 정보
		const questioner = !isMine ? question.questioner
						: {alias: memberAlias, image : memberImage, memberId : memberId}; 
		const $personacon = $question.find('.personacon-section');
		$personacon.find('.alias').text(questioner.alias);
		if(questioner.image) {
			$personacon.find('.personacon-profile')
						.removeClass('profile-default')
						.css('background','url(/resource/profile/images/'
						+ questioner.image + ') center/cover no-repeat');
		} 
		$question.find('.regdate').text(
				(isMine ? new Date() : new Date(question.regDate)).toLocaleDateString());
		// 질문 제목
		$question.find('.title-block .question-text:eq(0)')
				 .html(question.title.replace('[추가질문]', 
						 '<span class="text-violet">[추가질문]</span>'));
		// 질문 내용
		$question.find('.title-block .question-section .question-text')
				 .text($('<div></div>').html(question.content).text());
		$question.find('.content-block .question-text').html(question.content);
		// 본인 질문이 아니면 수정,평가버튼 삭제
		if(memberId != questioner.mid) {
			$question.find('.qna-mdf-btns, .survey-section').remove();
		}
		// 완료된 질문인 경우 답변입력란,평가버튼 삭제
		if('C' == question.qstatus) {
			$question.find('.add-section, .survey-section').remove();
		}
		// 본인 질문이 아니고 본인이 답변 우선권자가 아니면 답변입력란 비활성화
		if('R' == question.qstatus &&  question.questioner.mid != memberId
		&& memberId != question.priorityId) {
			$question.find('.add-section .text-input')
					 .attr('placeholder', '답변 우선권자의 답변을 기다리는 중입니다..')
					 .prop('disabled', true);
		}
		$question.attr('id', 'question' + qSeq)
				 .find('.accordion-button')
				 .attr('data-bs-target', '#question' + qSeq + ' .content-block');

		qSeq++;
		$question.appendTo($block);
		if(memberId == 0) $block.find('.collapse').hide();
		return $block;
	}
	function expressQstatus($qStatus, qStatus) {
		$qStatus.removeClass('bg-bittersweetshimmer bg-jazzberryjam bg-violet bg-coolblack');
		switch(qStatus) {
		case 'H':
			$qStatus.addClass('bg-bittersweetshimmer').text('대기중');
			break;
		case 'A':
			$qStatus.addClass('bg-jazzberryjam').text('다른 답변 요청');
			break;
		case 'R':
			$qStatus.addClass('bg-violet').text('답변예약');
			break;
		case 'C':
			$qStatus.addClass('bg-coolblack').text('완료');
			break;
		default:
			break;
		}
	}
	// 답변 정보를 DOM으로 생성
	function createAnswerDOM(answer, $question) {
		const $answerSection = $('#hiddenDivs .answer-section').clone().addClass('fade');
		// 답변자 정보
		$answerSection.data('answerId', answer.aid)
					  .data('memberId', answer.writer.mid);
		$answerSection.find('.alias').text(answer.writer?.alias);
		if(answer.writer?.image?.length > 0) {
			const $personacon = $answerSection.find('.personacon-section');
			const profile = $personacon.find('.personacon-profile')
								.removeClass('profile-default')[0];
			profile.style.background = 'url(/resource/profile/images/'
						+ answer.writer.image + ') center/cover no-repeat';
		}
		// 만족된 답변은 트로피 표시
		if(answer.satisLevel == 100) {
			$answerSection.find('.answer-text')
						  .before('<div class="material-icons text-yellow-400">emoji_events</div>');
		}
		// 본인 답변이 아니거나 평가가 된 답변은 수정버튼 삭제
		if(answer.writer.mid != memberId || answer.satisLevel > 0) {
			$answerSection.find('.qna-mdf-btns').remove();
		}
		// 본인 질문이 아니거나 평가가 된 답변은 평가버튼 삭제
		if(!$question.data('isMine') || answer.satisLevel > 0) {
			$answerSection.find('.satis-btns').remove();
		}
		// 날짜
		$answerSection.find('.regdate').text(new Date(answer.regDate).toLocaleDateString());
		// 답변 내용
		$answerSection.find('.answer-text').html(answer.content);
		return $answerSection;
	}	
	function showWorkBookInfo(workbookInfo, $section) {
		const $workbookSection = $section.find('.workbook-overview-section');
		$section.data('workbookId', workbookInfo.workbookId);
		$workbookSection.find('.wb-id').text(workbookInfo.workbookId);
		$workbookSection.find('.image-section img').on('click', () => location.assign(`/workbook/passage/${ntoa(workbookInfo.workbookId)}/${ntoa(workbookInfo.passageId)}`))
		if(workbookInfo.imagePath)
			$workbookSection.find('.image-section img').css('backgroundImage', `url(/resource/workbook/cover/${workbookInfo.imagePath})`);
		$workbookSection.find('.text-section .wb-title').text(workbookInfo.title);
		$workbookSection.find('.text-section .reg-date').text(new Date(workbookInfo.regDate).format('yyyy-MM-dd'));
		$workbookSection.find('.description').text(workbookInfo.description);
		$workbookSection.find('.text-section .p-title').text(workbookInfo.passageTitle);
		$workbookSection.find('.text-section .p-id').text(workbookInfo.passageId);
		$workbookSection.find('.writer-section .personacon-alias').text(workbookInfo.alias);
		$workbookSection.find('.age').text((new Date().getFullYear() + 1 - new Date(workbookInfo.birthYear).getFullYear()));
		if(workbookInfo.aliasImage)
			$workbookSection.find('.personacon-profile').css('backgroundImage', `url(/resource/profile/images/${workbookInfo.aliasImage})`);
	}	
	async function showSentenceDetail(sentenceInfo, $section) {
		// 문장 Id 설정
		$section.data('sentenceId', sentenceInfo.sentenceId).attr('id','sentence0');
		
		// 등록일 설정
		const regDate = new Date(sentenceInfo.regDate);
		$section.find('.s-regdate').text(regDate.format('yyyy-MM-dd HH:mm'));
		
		// 접기/펼치기 설정
		const originSentence = $section.find('.origin-sentence-section').get(0);
		originSentence.dataset.bsTarget = '#sentence0' + '>.collapse';
		originSentence.dataset.bsToggle = 'collapse';
		
		// 1. 원문 표시--------------------------------------------------------
		$section.find('.origin-sentence .sentence-text').text(sentenceInfo.text);
		
		// 2. SVOC 표시------------------------------------------------
		const text = $section.find('.origin-sentence .sentence-text').text(), svocList = sentenceInfo.svocList,
			svocListLen = svocList?.length;
		// 구문분석 접기 버튼 추가. 2개 이상의 분석이 있으면 접기
		$section.find('.js-collapse-svoc').toggle((svocListLen > 1));

		$section.find('.result-semantic-section').empty();
		for(let j = 0; j < svocListLen; j++) {
			let svocTag = svocList[j];
			const $svocBlock = $(createElement(svocSectionJson));
			if(j > 0) $svocBlock.addClass('collapse');
			$svocBlock.appendTo($section.find('.result-semantic-section'));
			tandem.showSemanticAnalysis(text, svocTag.svocBytes, $svocBlock.find('.svoc-block'))
			.then(div => {
				$(div).data('svocId', svocTag.svocId)
						.data('memberId', svocTag.memberId);
				$svocBlock.find('.writer-section')
					.attr('data-bs-target', `#${$section.attr('id')} .dashboard-section`)
					.find('.personacon-alias').text(svocTag.writerAlias);
				
				let $mdfBtns = $svocBlock.find('.svoc-mdf-btns');
				$mdfBtns.find('[data-seq]').attr('data-seq', div.dataset.seq);
				if(memberId != svocTag.memberId) {
					$mdfBtns.remove();
				}
				const $personacon = $('#hiddenDivs .member-personacon:eq(0)').clone(true);
				if(svocTag.image) {
					const profile = $personacon.find('.personacon-profile')
										.removeClass('profile-default')[0];
					profile.style.background = 'url(/resource/profile/images/'
								+ svocTag.image + ') center/cover no-repeat';
				}
				$svocBlock.find('.writer-section').prepend($personacon);
				
				if(window['tandem'] != undefined && tandem['meta'] != undefined
				&& j + 1 == svocListLen && sentenceInfo.metaStatus != null && sentenceInfo.metaStatus == 'N') {
					// gramMeta 저장(ajax)---------------------------------------
					tandem.meta.saveGramMetaFromDOM(sentenceInfo.sentenceId, div, false, 'workbook');
					// ---------------------------------------------------------
				}			
			})
			
		}
		
		// 3. 분석 평가 표시
		$section.find('.dashboard-section .meta-status')
			.text({'S':'🥳','F':'🤯'}[sentenceInfo.metaStatus]||'🤔')
			.attr('title',{'S':'평가를 받은 문장이예요.','F':'분석이 틀렸대요.'}[sentenceInfo.metaStatus]||'아직 평가되지 않은 문장이예요.')		
			
		// 4. 해석 표시 
		
		const korList = sentenceInfo.korList;
		if(korList != null && korList.length > 0) {
			const korListLen = korList.length,
				$aiTransSection = $section.find('.ai-translation-section')
											   .show().empty();
			for(let j = 0; j < korListLen; j++) {
				const $transBlock = $transCopyBlock.clone();
				const korTrans = korList[j];
				$aiTransSection.append($transBlock);
				$transBlock.data('korTid', korTrans.korId);
				if(korTrans.alias != 'Translator') {
					$transBlock.find('.translator').text('by ' + korTrans.alias);
				}
				$transBlock.find('.translation-text').text(korTrans.kor);
				if(memberId == korTrans.memberId) {
					$transBlock.append(createElement(transModifyBtnsJson));
				}
			}
			$aiTransSection.find('.ai-translation-block').first().collapse('show');
		}
		// 5. 단어 표시 
		const wordList = sentenceInfo.wordList;
		if(wordList != null && wordList.length > 0) {
			const wordListLen = wordList.length,
				$wordSection = $section.find('.word-section').empty();
			
			var msg = '<div class="title-section position-relative"><span class="sub-title">문장에서 등장하는 단어를 fico가 대신 검색하여 제공해 드립니다.</span></div>';
			$wordSection.append(msg);
			
			for(let j = 0; j < wordListLen; j++) {
				const word = wordList[j], $wordBlock = $wordCopySection.clone();
				$wordBlock.find('.one-part-unit-section').remove();
				
				// 단어의 품사별 뜻 표시
				$wordSection.append($wordBlock);
				$wordBlock.find('.title').text(word.title);
				const senseList = word.senseList;
				if(senseList == null) continue;
				var senseListLen = senseList.length;
				
				for(let k = 0; k < senseListLen; k++) {
					const sense = senseList[k], $partBlock = $partCopySection.clone();
					
					$wordBlock.append($partBlock);
					$partBlock.find('.part').text(sense.partType);
					$partBlock.find('.meaning').text(sense.meaning);
				}
			}
			// 데스크탑에서는 단어리스트 미리 표시
			if(window.visualViewport.width > 576)
				$section.find('.nav-link[data-type="word-list"]').tab('show');			
		}
		$('#ssamNoteRequestDetailSection').collapse('show')
		.find('.one-sentence-unit-section>.collapse').collapse('show');
	}		
}

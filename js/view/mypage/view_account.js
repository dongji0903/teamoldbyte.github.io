/** /mypage/view_account.html
@author LGM
 */
function pageinit(tray, normalEggCount, goldEggCount) {
	let eggInfoList = [];
	$.getJSON('https://static.findsvoc.com/data/egg/egg-info.json', list => {
		eggInfoList = list;
	})
	// [보유 에그 표시]------------------------------------------------------------
	const eggDOMs = []
	for(let i = 0; i < 9; i++) {
		eggDOMs.push({ el: 'div', className: 'egg-info', role: tray[i] == 0 ? null : 'button', children: [
			// 에그 그래픽 영역
			{ el: 'div', className: 'egg-wrapper m-auto', style: 'transform: scale(0)', children: [
				{ el: 'div', className: `egg${tray[i] == 0 ? ' uncollected' : (' egg-' + (i + 1) + (i > 4 ? ' metallic' : ''))}`, children: [
					{ el: 'div', className: 'fill' },
					{ el: 'div', className: 'shading' },
					{ el: 'div', className: 'key' },
					{ el: 'div', className: 'highlight' }
				]}
			]},
			// 에그 카운터 영역
			{ el: 'div', className: 'egg-count-section text-center mt-2', children: [
				{ el: 'span', className: 'egg-count', innerText: tray[i] > 0 ? tray[i] : '' }
			]}
		]});
	}
	// 골드 추가
	eggDOMs.push({ el: 'div', className: 'egg-info', role: 'button', children: [
		{ el: 'div', className: 'egg-wrapper m-auto', style: 'transform: scale(0)', children: [
			{ el: 'div', className: 'egg metallic gold', children: [
				{ el: 'div', className: 'fill' },
				{ el: 'div', className: 'shading' },
				{ el: 'div', className: 'key' },
				{ el: 'div', className: 'highlight' }
			]}
		]},
		{ el: 'div', className: 'egg-count-section text-center mt-2', children: [
			{ el: 'span', className: 'egg-count', innerText: goldEggCount }
		]}
	]});	
	document.querySelector('.egg-dimention-section').append(createElement(eggDOMs));
	// 에그를 하나씩 표시
	anime({
		targets: '.egg-dimention-section .egg-info .egg-wrapper',
		delay: anime.stagger(100,{start:500}),
		duration: 1000,
		scale: [0,1]
	});
	
	// [총 에그 보유량(숫자) 표시]---------------------------------------------------
	setTimeout(() => {
		anime.timeline({
			duration: 1000,
			fontSize: ['0%', '100%'],
		})
		.add({
			targets: '#total-egg-count',
			update: function(anim) {
				anim.animatables[0].target.textContent = Math.round((normalEggCount || 0) * anim.progress / 100);
			}
		})
		.add({
			targets: '#total-gold-egg-count',
			update: function(anim) {
				anim.animatables[0].target.textContent = Math.round((goldEggCount || 0) * anim.progress / 100);
			}
		})
	}, 500);
	
	// [버킷 진행도 표시]---------------------------------------------------------
	let bucketLevel = 1, bucketSize = 1, _quotient = normalEggCount;
	while(_quotient >= 9) {
		_quotient /= 3;
		bucketSize *= 3;
		bucketLevel++;
	}
	bucketLevel = Math.max(1, bucketLevel);
	
	// 버킷 전체보기 세팅
	const bucketHistory = [];
	for(let i = 0; i < bucketLevel; i++) {
		bucketHistory.push({
			el: 'div', className: 'col-4 row g-0 my-4', children: [
				{ el: 'div', className: 'col-10 text-center', children: [
					{ el: 'div', className: `bucket-icon bucket-${i+1} text-warning` },
					{ el: 'div', className: 'text-xl', innerText: `Lv.${i+1}` }
				]},
				{ el: 'div', className: 'col-2 my-auto text-center', children: [
					{ el: 'i', className: 'fas fa-arrow-right text-2xl text-gray-400' }
				]}
			]});
	}
	bucketHistory.push({
		el: 'div', className: 'col-4 row g-0 my-4', children: [
			{ el: 'div', className: 'col-10 text-center', children: [
				{ el: 'div', className: 'bucket-icon uncollected text-gray-400' },
				{ el: 'div', className: 'text-xl' }
			]},
			{ el: 'div', className: 'col-2 my-auto text-center' }
		]});

	const bucketDOMs = [];
	const bucketStatus = document.querySelector('.total-egg-section');
	// 총 9개의 버킷 표시
	for(let i = 0; i < 9; i++) {
		const rest = (normalEggCount - bucketSize * i);
		const count = (rest >= bucketSize) ? bucketSize 
					: (rest > 0) ? rest : 0;
		const bucket = createElement({
			el: 'div', className: `bucket-icon position-relative bucket-${bucketLevel}`,
			role: 'button', 'data-bs-toggle': 'tooltip', 'data-count': count,
			title: `${count}/${bucketSize}`
		})
		bucketDOMs.push(bucket);
		bucketStatus.append(bucket);
	}
	// 버킷을 차례대로 채워나감
	const buckettimeline = anime.timeline({ duration: 500, easing: 'linear' })
	setTimeout(() => {
		for(let i = 0; i < 9; i++)
			buckettimeline.add({
				targets: bucketDOMs[i],
				update: function(anim) {
					// 버킷의 바닥부터 채워짐
					const target = anim.animatables[0].target;
					target.style.backgroundImage = `-webkit-linear-gradient(90deg, var(--fc-purple) ${parseInt(target.dataset.count)/bucketSize * anim.progress}%, #fff 0%)`;
				},
				complete: function(anim) {
					const target = anim.animatables[0].target;
					// 가득찬 버킷은 톡톡 터지는 효과 표시
					if(parseInt(target.dataset.count) == bucketSize)
						showFireworks({ target,
							size: 5, distance: 40, particles: 10, count: 1,
							time: 1, interval: 1,
							top: '-30px', left: 'calc(50% - 40px)',
							width: '80px', height: '80px',
							colors: ['#bb99bff','#99bbff']
						})
				}
			}, '-=200')
	}, 1000);
	
	
	// [에그를 클릭하면 에그정보 상세보기]--------------------------------------------------
	$(document).on('click', '.egg-info', function(e) {
		const detail = document.querySelector('.egg-detail-section');
		const selectedEgg = this.querySelector('.egg');
		const eggIndex = parseInt((selectedEgg.className.match(/egg-(\d+)/)||{ 1 : 10 })[1]) - 1;
		if(selectedEgg.matches('.uncollected')) return;
		// 골드 여부
		const isGold = selectedEgg.matches('.gold');
		// 골드 여부에 따라 표시여부가 달라지는 항목들 선택자
		const selectiveInfo = Array.from(['count-text','hatching-info','writer'], s => '.egg-text-info-section .'+s).join(',');
		
		$(detail).find(selectiveInfo).toggle(!isGold);
		
		// 에그 종류에 따른 클래스 추가
		detail.querySelector('.egg').className = 
			`egg${eggIndex < 9 ? tray[eggIndex] == 0 ? ' uncollected' : (' egg-' + (eggIndex + 1) + (eggIndex > 4 ? ' metallic' : '')) : ' metallic gold'}`;
		// 에그 이름
		const eggClass = eggIndex < 5 ? 'pastel' : eggIndex < 9 ? 'shining' : 'gold';
		detail.querySelector('.egg-text-info-section .name').innerHTML 
			= `<span class="badge egg-sort ${eggClass}">name</span>` + eggInfoList[eggIndex].name;
		// 에그 부화 d-day
		if(!isGold) 
			detail.querySelector('.egg-text-info-section .egg-count').textContent 
			= 900 - parseInt(this.querySelector('.egg-count').textContent)
		// 에그 타이틀
		detail.querySelector('.egg-text-info-section .title').innerHTML = eggInfoList[eggIndex].title;
		// 에그 설명
		detail.querySelector('.egg-text-info-section .desc').innerHTML = eggInfoList[eggIndex].desc;
		
		// 골드의 경우 반짝임 효과
		if(isGold) 
			showFireworks({target: detail.querySelector('.egg'),
				size: 1, distance: 100, colors: ['#FFFFFF'], interval: 500, count: 5, particles: 5
			});
		// 데스크톱용 상세보기 위치 설정
		if(window.innerWidth >= 576) {
			if(e.currentTarget.getBoundingClientRect().x > window.innerWidth / 2) {
				detail.style.left = 'unset';
				detail.style.right = `${document.body.clientWidth - this.offsetLeft - this.offsetWidth}px`;
			}else {
				detail.style.right = 'unset';
				detail.style.left = `${e.currentTarget.getBoundingClientRect().x}px`;
			}
			detail.style.top = `${e.currentTarget.offsetTop}px`;
			detail.querySelector('.btn-close')?.remove();
		}
		// 모바일용 상세보기 위치
		else {
			detail.style.position = 'fixed';
			detail.style.top = 0;
		}
		$(detail).show(200);
	})
	// [에그 상세보기에서 커서를 떼면 닫기]---------------------------------------------
	.on('mouseleave', '.egg-detail-section', function(e) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		$('.egg-detail-section').hide();
	})

	// [에그 내역 조회]------------------------------------------------------------
	$('#accountEventTable').one('show.bs.collapse', function() {
		// 코인내역 조회(ajax)------------------------------
		$.getJSON('/mypage/account/event/list', listEvents)
		.fail(() => {
			alert('에그 내역을 불러오지 못했습니다.');
		});
		//-----------------------------------------------
	});
	// [에그 내역 추가 조회]--------------------------------------------------------
	$(document).on('click', '#accountEventPagination .page-link', function() {
		const pageNum = this.dataset.pagenum;
		// 에그 내역 추가 조회(ajax)-------------------------------------------
		$.getJSON('/mypage/account/event/list?pageNum=' + pageNum, listEvents)
		.fail(() => alert('에그 내역을 불러오지 못했습니다.'));
		//------------------------------------------------------------------
	})
	// [버킷을 클릭하면 버킷 전체정보 보기]---------------------------------------------
	$(document).on('click', '.bucket-icon', function() {
		$('#bucket-modal').modal('show');
	});
	function listEvents(events) {
		const eventList = document.getElementById('accountEventList');
		if(!events?.empty) {
			const contents = events.content
			// 레코드 표시
			const eventRecords = [];
			for(let i = 0, len = contents.length; i < len; i++) {
				const myEvent = contents[i];
				eventRecords.push({
						el: 'tr', children: [
							// 레코드 번호 표시
							{ el: 'th', className: 'd-none d-md-table-cell', scope: 'row', innerText: events.size * events.number + i + 1 },
							// 이벤트 상세
							{ el: 'td', innerText: myEvent.description },
							{ el: 'td', children: [
								// 일반 에그 표시
								myEvent.amount != 0 ? { el: 'span', className: 'text-' + (myEvent.amount < 0 ? 'danger':'success'),
									children: [
										{ el: 'i', className: 'fas fa-egg text-white text-stroke-gray ms-3 me-2' },
										Number(myEvent.amount).toLocaleString('ko-KR',{signDisplay:'always'})
									]} : '',
								// 골드 에그 표시
								myEvent.gold != 0 ? { el: 'span', className: 'text-' + (myEvent.gold < 0 ? 'danger': 'success'),
									children: [
										{ el: 'i', className: 'fas fa-egg egg-icon gold ms-3 me-2' },
										Number(myEvent.gold).toLocaleString('ko-KR', { signDisplay: 'always' })
									]} : ''
							]},
							// 날짜
							{ el: 'td', innerText: new Date(myEvent.txDate).format('yyyy-MM-dd(e) HH:mm') }
						]
					});
			}
			eventList.replaceChildren(createElement(eventRecords));
			// 페이지네이션 표시
			const pagination = document.getElementById('accountEventPagination');
			const totalPages = events.totalPages;
			const currPage = events.number;
			const startNum = Math.floor(currPage / 10) * 10 + 1;
			const endNum = Math.min(startNum + 9, totalPages);
			const pageitems = [];
			// 이전 버튼
			if(startNum > 10) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Previous', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum - 1, innerHTML: '&laquo;' }
				]});
			// 페이지번호 버튼
			for(let pi = startNum; pi <= endNum; pi++) pageitems.push({
				el: 'li', className: 'page-item' + (pi == currPage + 1 ? ' active' : ''), children: [
					{ el: 'a', className: 'page-link', 'data-pagenum': pi, innerHTML: pi }
				]});
			// 다음 버튼
			if(startNum + 9 < totalPages) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Next', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum + 10, innerHTML: '&raquo;' }
				]});
			pagination.replaceChildren(createElement(pageitems));
		} else {
			eventList.replaceChildren(createElement({el: 'tr', innerText: '내역이 존재하지 않습니다.'}));
		}
	}
	
	
	// [코인 충전 혹은 멤버십 연장 버튼을 눌러 결제 모달 표시]------------------------------
	$('.js-open-extend').click(function() {
		if($('#modalDiv').children().length == 0) {
			$('#modalDiv').load('/mypage/membership/extend .modal', displayModal);
		}else displayModal();
		
		function displayModal() {
			$('#modalDiv .modal').modal('show');
		}
		
	});
	let nextTimer; 
	let orderItemList = [];
	// [상품 선택 완료]------------------------------------------------------------
	$(document).on('submit', '#selectItemForm', function() {
		if(this.checkValidity()) {
			event.preventDefault();
			const $item = $('#phase-1 [name=orderItem]:checked');
			const itemName = $item.data('itemname');
			const price = $item.next('.membership-block').find('.price').text();
			
			$('#totalAmount').val(price.replace(/[^0-9]/g,''));
			orderItemList = [$item.val()];
			$('#phase-2 .payment-info .name').text(itemName);
			$('#phase-2 .payment-info .price').text(price);
			$('#phase-1,#phase-2').collapse('toggle');
		}
	})
	// [결제 대기]----------------------------------------------------------------
	.on('show.bs.collapse', '#modalDiv #phase-2', function() {
		$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', true);
		clearInterval(nextTimer);
		$('#phase-2 .progress-bar').attr('aria-valuenow', 0).width(0);
		let progress = 0
		nextTimer = setInterval(() => {
			if(progress < 100) {
				progress++;
				$('#phase-2 .progress-bar').attr('aria-valuenow', progress)
										.width(progress + '%');
				$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', true);
			}else {
				$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', false);
			}
		}, 1000);
	})
	.on('hide.bs.collapse', '#modalDiv #phase-2', function() {
		clearInterval(nextTimer);
	})
	// [추가정보 입력 완료]---------------------------------------------------------
	.on('submit', '#paymentForm', function(e) {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(this).entries());
		if(this.checkValidity()) {
			data["orderItemList"] = orderItemList;
			$.ajax({
				url: '/membership', type: 'POST', 
				data: JSON.stringify(data),
				contentType: 'application/json', 
				success: () => {
					alert('멤버십이 연장되었습니다.\n다시 로그인해 주세요.');
					document.forms.logout.submit();
				},
				error: () => {
					alert('가입 처리 중 오류가 발생하였습니다.\nteamoldbyte@gmail.com 로 문의 바랍니다.');
					$('#done-info-moal').modal('hide');
				}
			})
		}
	});
	
	
	document.body.append(createElement([
		{ el: 'div', className: 'bucket-detail-section modal', id: 'bucket-modal', tabIndex: '-1', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content', children: [
					{ el: 'div', className: 'modal-body px-1 px-md-5', children: [
						{ el: 'div', className: 'bucket-history row g-0', children: bucketHistory }
					]}
				]}
			]}
		]},
		{ el: 'div', className: 'egg-detail-section' + (window.innerWidth < 576 ? ' top-50 translate-middle-y' : ''), style: { display: 'none', position: 'absolute', zIndex: 1062 }, children: [
			{ el: 'div', className: 'btn btn-close position-absolute end-3', onclick: "$('.egg-detail-section').hide(100)" },
			{ el: 'div', className: 'row g-0', children: [
				{ el: 'div', className: 'col-12 col-md-8', children: [
					{ el: 'div', className: 'egg-wrapper', children: [
						{ el: 'div', className: 'shadow', children: [
							{ el: 'div', className: 'main' },
							{ el: 'div', className: 'secondary'}
						]},
						{ el: 'div', className: 'egg', children: [
							{ el: 'div', className: 'fill' },
							{ el: 'div', className: 'shading' },
							{ el: 'div', className: 'key' },
							{ el: 'div', className: 'highlight' }
						]}
					]}
				]},
				{ el: 'div', className: 'egg-text-info-section col-12 col-md-4', children: [
					{ el: 'h4', className: 'name' },
					{ el: 'span', className: 'title' },
					{ el: 'span', className: 'desc' },
					{ el: 'span', className: 'writer', textContent: '- Alalos Eggsy -' },
					{ el: 'div', className: 'position-absolute bottom-0', children: [
						{ el: 'span', className: 'count-text', children: [
							'Hatching D-Day : ',
							{ el: 'span', className: 'egg-count' },
							' left.'
						]},
						{ el: 'span', className: 'hatching-info', textContent: '에그를 부화시켜 마법사 에그시가 숨겨놓은 선물을 받아가세요.' }
					]},
				]}
			]}
		]}
	]));
} //end of ready

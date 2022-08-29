/** /layout/**_layout.html
@author LGM 
 */
function initLayout(csrf, loggedIn) {
	// 로그인 전용 버튼은 비로그인 상태에서 동작하지 않도록 설정
	$(document).on('click', '.login-required', function(e) {
		if(!loggedIn) {
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
			if(confirm('fico 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?')) location.assign('/auth/login');
			return false;
		}		
	}).on('show.bs.modal', '.modal', function(e) {
		if(!loggedIn && e.relatedTarget != null && e.relatedTarget.matches('.login-required'))
			e.preventDefault();
	})
	
	if(csrf) {
		// POST 방식 전송에 대해 csrf 설정
		$(document).ajaxSend((_event, jqXHR, options)=>{
			if(options.type == 'POST' 
			&& (options.url.startsWith('/') || options.url.startsWith(location.origin))){
				jqXHR.setRequestHeader(csrf.headerName, csrf.token);
			}
		});
		// 첫 로그인인 사용자에겐 튜토리얼을 진행한다.
		if(loggedIn && !localStorage.getItem('tutorialEnds')) {
			$.ajax({dataType: 'script', cache: true, url:'https://static.findsvoc.com/js/app/tutorials.min.js'});
		}
	}
}

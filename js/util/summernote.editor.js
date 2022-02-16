/**
 * Summernote(Rich Text Editor)
 */
async function openSummernote($input) {
	if(typeof $.summernote == 'undefined') {
		$('head').append('<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css">');
		await $.getScript('https://cdn.jsdelivr.net/combine/npm/summernote@0.8.18/dist/summernote-lite.min.js,npm/summernote@0.8.18/lang/summernote-ko-KR.min.js');
		await $.getScript('https://static.findsvoc.com/js/util/summernote.plugins.js');
		const customstyle = document.createElement('style');
		customstyle.innerHTML = '.note-editor.note-frame {-webkit-user-select: initial;user-select: initial;}.note-toolbar .dropdown-toggle::after{display:none;} .note-editable{font-family: "HCRDotum";}';
		document.head.append(customstyle);
	}
	$input.summernote({
		colorButton: {
			foreColor: '#FF0000', backColor: '#FFFF00'
		},
		toolbar: [
			['style', ['style']],
			['font', ['bold', 'italic', 'underline', 'clear']],
			['fontname', ['fontsize']],
			['color', ['forecolor','backcolor']],
			['para', ['ul', 'ol', 'paragraph']],
			['table', ['table']],
			['insert', ['link', 'picture', 'video']],
			['view', ['help']],
		],
		styleTags: [
			'p', { title: '제목', tag: 'h4', value: 'h4'}
		],
		fontNames: ['RIDIBatang', 'HCRDotum'],
		fontSizes: ['10', '12', '14', '16', '18', '24', '36'],
		lang: 'ko-KR',
		callbacks: {
			onPaste: function(e) {
				var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
				if(bufferText != null && bufferText.length > 0) {
					e.preventDefault();
					// Firefox fix
					setTimeout(function () {
						$input.summernote('pasteHTML', bufferText.replaceAll(/\n/g,'<br/>'));
						// document.execCommand('insertText', false, bufferText);
					}, 10);
				}
			},
			onChange: function (contents, $editable) {
				const maxContents = 65000,
					popover = bootstrap.Popover.getOrCreateInstance($editable[0], 
									{content:'본문 내용이 너무 길어 '
										+ maxContents + '자를 초과한 글자는 제거되었습니다.'});
				if(contents.length > maxContents) {
					$(this).summernote('code',contents.substring(0, maxContents));
					popover.show();
				}else popover.hide();
			},			
			onImageUpload: function(files) {
				const _this = this;
				var formData = new FormData();
				for(let i = 0, filesLen = files.length; i < filesLen;i++) {
					if(files[i].size > 1024 * 1024) {
						alert('업로드 용량 초과: ' + Math.ceil(files[i].size / 1024) + 'KB\n(최대 용량: 1024KB)');
						return;
					}else formData.append('files', files[i]);
				}
				$.ajax({
			        type: 'POST',
			        url: '/sn/fileUpload',
			        data: formData,
			        processData: false,
			        contentType: false,
			        success: function (resourceUrlList) {
			        	for(let i = 0, len = resourceUrlList.length; i < len; i++) {
			        		const resourceUrl = resourceUrlList[i];
				        	if(resourceUrl == null || resourceUrl.startsWith('NOT_ALLOWED')){
				        		alert('허용되지 않는 형식의 파일입니다.\n파일: '
			        				+ resourceUrl.replace('NOT_ALLOWED',''));
				        	}else{
				        		const img = '<img src="' + resourceUrl + '">';
				        		$(_this).summernote('insertImage', resourceUrl);
				        	}
			        	}
			        },
			        error: function (xhr) {
						//-----------------------------------
						alert('파일을 업로드하지 못했습니다. 다시 시도해 주세요.')
						//-----------------------------------
			        }
			    });
			}
		}
	});
}

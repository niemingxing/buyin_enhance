let currentDomain = window.location.hostname;
let currentUrl = "";
let userItemList = [];
let darenProfileUrl = "https://buyin.jinritemai.com/dashboard/servicehall/daren-profile?uid={uid}&previous_page_name=14&previous_page_type=11";
let downloadDataNums = 0;
/**
 * 初始化弹层
 */
function initToolButton() {
	const html = '<div class="gpt-sr-container">\n' +
		'    <div class="gpt-sr-sidebar">\n' +
		'      <button id="dylive-sr-toggleButton">下载数据</button>\n' +
		'    </div>\n' +
		'  </div>';
	const popupElement = document.createElement("div");
	popupElement.innerHTML = html;
	document.body.appendChild(popupElement);
	document.querySelector("#dylive-sr-toggleButton").addEventListener("click", function() {
		this.disabled = true;
		chrome.runtime.sendMessage({"type":"check_mkey"}, function (response) {
			console.log(response.farewell)
		});
	});
}



function activiteToolButton()
{
	document.querySelector("#dylive-sr-toggleButton").disabled = false;
}

function updateDownloadNums()
{
	let videoListObj = document.querySelector("div.video-list-page-view");
	if(videoListObj)
	{
		let videoItemObj = videoListObj.querySelectorAll("tr.auxo-table-row");
		downloadDataNums = videoItemObj.length;
	}
	else
	{
		downloadDataNums = 0;
	}
	document.querySelector("#dylive-sr-toggleButton").textContent = "下载数据(" + downloadDataNums + ")";
}

/**
 * 初始化提示窗
 */
function initPromptMessagePopup()
{
	let html = "<div id=\"nmx_buyin_popup\" class=\"custom-popup\">\n" +
		"\t\t<div class=\"custom-popup-overlay\"></div>\n" +
		"\t\t<div class=\"custom-popup-content\">\n" +
		"\t\t\t<span id=\"nmx_buyin_popup_message\" class=\"custom-popup-question\"></span>\n" +
		"\t\t\t<button id=\"nmx_buyin_close_popupbtn\" class=\"custom-popup-close-btn\">确认</button>\n" +
		"\t\t</div>\n" +
		"\t</div>";
	const popupElement = document.createElement("div");
	popupElement.innerHTML = html;
	document.body.appendChild(popupElement);
	// 获取弹窗元素
	const popup = document.getElementById('nmx_buyin_popup');
	// 获取关闭按钮元素
	const closeButton = document.getElementById('nmx_buyin_close_popupbtn');
	// 点击关闭按钮关闭弹窗
	closeButton.addEventListener('click', function (){
		popup.style.display = 'none';
	});
}


// 显示弹窗并设置错误提示文字
function showPromptMessagePopup(message,type =1) {
	// 获取弹窗元素
	const popup = document.getElementById('nmx_buyin_popup');
	// 获取错误提示元素
	const errorText = document.getElementById('nmx_buyin_popup_message');
	errorText.textContent = message;
	popup.style.display = 'block';
	if(type == 2)
	{
		// 获取关闭按钮元素
		const closeButton = document.getElementById('nmx_buyin_close_popupbtn');
		closeButton.style.display = 'none';
		setTimeout(function (){
			closeButton.click();
		},2000);
	}
}

/**
 * 引入css文件
 * @param url
 */
function addStylesheet(url) {
	const linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	linkElement.type = "text/css";
	linkElement.href = chrome.runtime.getURL(url);
	document.head.appendChild(linkElement);
}

async function startDownloadData()
{
	let videoListObj = document.querySelector("div.video-list-page-view");
	if(videoListObj)
	{
		let videoListObjs = videoListObj.querySelectorAll("tr.auxo-table-row");
		let downloadDataList = [];
		for(let i =0;i<videoListObjs.length;i++)
		{
			let element = videoListObjs[i];
			let videoUrl = "https://www.douyin.com/video/" + element.getAttribute("data-row-key");
			let title = element.children[0].querySelector("div.thumbnail-item-title").textContent;
			let time = element.children[0].querySelector("div.thumbnail-item-subtitle").textContent;
			let playNum = element.children[1].textContent.replace(",","");
			playNum = convertToNumber(playNum);
			let interactionRate = element.children[2].textContent;
			let salesVolume = element.children[3].textContent;
			let gpm =element.children[4].textContent;
			let goodNum =element.children[5].textContent;
			let dataItem = {
				'title' : title,
				'time' : time,
				'playNum' : playNum,
				'interactionRate' :interactionRate,
				'salesVolume' :salesVolume,
				'gpm':gpm,
				'goodNum':goodNum,
				'videoUrl':videoUrl,
				'goodContent':''
			};
			if(goodNum!="-")
			{
				element.querySelector("span.icon-commodity").click();
				let goodContent = await getGoodList();
				dataItem.goodContent = goodContent;
			}
			downloadDataList.push(dataItem);
			console.log(dataItem);
			await waitAMoment();
		}
		let header = ["视频名称","发布时间","播放量","互动率","销售额","视频GPM","商品数量","商品信息","视频地址"];
		let keys = ['title','time','playNum','interactionRate','salesVolume','gpm','goodNum','goodContent','videoUrl'];
		let csvContent = convertToCSVContent(downloadDataList,header,keys);
		downloadCsv(csvContent);
	}
}

function getGoodList()
{
	return new Promise(function(resolve, reject) {
		setTimeout(function (){
			let goodPanel = document.querySelector("div.auxo-modal-confirm-confirm");
			let goodListObjs = goodPanel.querySelectorAll("tr.auxo-table-row");
			let goodContent = "";
			for(let i =0;i<goodListObjs.length;i++)
			{
				let element = goodListObjs[i];
				console.log(element);
				let gUrl = "https://haohuo.jinritemai.com/views/product/item2?id="+element.getAttribute("data-row-key");
				let gTitle = element.children[0].querySelector("div.thumbnail-item-title").textContent;
				let gPrice = element.children[1].textContent;
				let gSalesVolume = element.children[2].textContent;
				if(i == 0)
				{
					goodContent = gTitle+"(" + gPrice + ")(" + gSalesVolume + "):"+gUrl
				}
				else
				{
					goodContent = goodContent + "|" + gTitle+"(" + gPrice + ")(" + gSalesVolume + "):"+gUrl
				}
			}
			goodPanel.querySelector("img.related-product-modal__close").click();
			resolve(goodContent);
		},3000);
	})
}
function initDarenProfile()
{
	setInterval(function (){
		updateDownloadNums();
		initOperateAction();
	},3000);
}
function initOperateAction()
{
	let videoListObj = document.querySelector("div.video-list-page-view");
	if(videoListObj)
	{
		let header = videoListObj.querySelector("thead.auxo-table-thead tr");
		let operateObj = header.querySelector("th.custom-operate");
		if(!operateObj)
		{
			const newThElement = document.createElement('th');
			newThElement.className = 'auxo-table-cell custom-operate';
			newThElement.setAttribute('elementtiming', 'element-timing');
			newThElement.textContent = '操作';
			header.appendChild(newThElement);
		}
		let videoListObjs = videoListObj.querySelectorAll("tr.auxo-table-row");
		for(let i =0;i<videoListObjs.length;i++)
		{
			let lineObj = videoListObjs[i];
			const tdElement = lineObj.querySelector('td.custom_copy');
			if(!tdElement)
			{
				const newTdElement = document.createElement('td');
				newTdElement.className = 'auxo-table-cell custom_copy';
				newTdElement.setAttribute('elementtiming', 'element-timing');
				const linkElement = document.createElement('a');
				linkElement.href = '#'; // 设置链接的href属性
				linkElement.textContent = '复制';
				newTdElement.appendChild(linkElement);
				lineObj.appendChild(newTdElement);
				// 绑定单击事件
				linkElement.addEventListener('click', async function(event) {
					event.preventDefault();
					let element = this.parentElement.parentElement;
					const textArray = [];
					let title = element.children[0].querySelector("div.thumbnail-item-title").textContent;
					textArray.push("视频标题：" + title);
					let videoUrl = "https://www.douyin.com/video/" + element.getAttribute("data-row-key");
					textArray.push("视频地址：" + videoUrl);
					let time = element.children[0].querySelector("div.thumbnail-item-subtitle").textContent;
					textArray.push("发布时间：" + time);
					let playNum = element.children[1].textContent.replace(",","");
					textArray.push("播放量：" + playNum);
					let interactionRate = element.children[2].textContent;
					textArray.push("互动率：" + interactionRate);
					let salesVolume = element.children[3].textContent;
					textArray.push("销售额：" + salesVolume);
					let gpm =element.children[4].textContent;
					textArray.push("视频GPM：" + gpm);
					let goodNum =element.children[5].textContent;
					if(goodNum!="-")
					{
						element.querySelector("span.icon-commodity").click();
						let goodContent = await getGoodList();
						textArray.push("关联商品：" + goodContent);
					}
					const copyText = textArray.join("\n");
					// 使用Clipboard API将文本复制到剪切板
					navigator.clipboard.writeText(copyText)
						.then(function() {
							showPromptMessagePopup("复制成功!",2);
						})
						.catch(function(err) {
							showPromptMessagePopup("复制失败!",2);
						});
				});
			}
		}
	}
}

function waitAMoment()
{
	return new Promise(function(resolve, reject) {
		setTimeout(function (){
			resolve("success");
		},2000);
	})
}

/**
 * 播放量转数字
 * @param str
 * @returns {number|number}
 */
function convertToNumber(str) {
	const match = str.match(/(\d+(\.\d+)?)/);
	if (match) {
		const num = parseFloat(match[1]);
		if(str.includes("w"))
		{
			return num * 10000;
		}
		else if(str.includes("万"))
		{
			return num * 10000;
		}
		return num;
	}
	return str;
}

/**
 * 保存内容为csv文件
 * @param csvContent
 */
function downloadCsv(csvContent)
{
	// 创建一个 Blob 对象，将内容保存为 CSV 文件
	var blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });

	// 生成一个临时下载链接并下载文件
	var link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "data(" + currentDomain+ ").csv";
	link.click();
}

/**
 * 把数组转换成csv内容
 * @param data
 * @returns {string}
 */
function convertToCSVContent(data,header=[],keysArr = []) {
	let pHeader = header;
	let pKeysArr = keysArr;
	const rows = data.map(row => pKeysArr.map(key => formatCSVValue(row[key])).join(","));
	return [pHeader.join(",")].concat(rows).join("\n");
}

/**
 * 格式化csv内容特殊字符
 * @param value
 * @returns {string}
 */
function formatCSVValue(value) {
	if (typeof value === 'string') {
		if (/[",\n\t]/.test(value)) {
			value = value.replace(/"/g, '""');
			value = `"${value}"`;
		}
	}
	return value;
}

/**
 * 获取页面类型
 * @returns {string}
 */
function getPageType()
{
	currentUrl = window.location.href;
	console.log("pageUrl:"+currentUrl);
	let pageType = '';
	if(currentUrl.includes("https://buyin.jinritemai.com/dashboard/example-daren"))
	{
		pageType = "dashboard-example-daren";
	}
	else if(currentUrl.includes("https://buyin.jinritemai.com/dashboard/servicehall/daren-profile"))
	{
		pageType = "dashboard-servicehall-daren-profile";
	}
	console.log(pageType);
	return pageType;
}

function initExampleDarenButton(elementsWithPrefix)
{
	// 遍历元素集合
	elementsWithPrefix.forEach(function(element,index) {
		// 查找元素下的所有子元素
		var operateContainer= element.children[2];
		var childLinks = operateContainer.querySelectorAll('a[daren-profile]');
		// 如果没有子元素包含 daren-profile 属性
		if (childLinks.length === 0) {
			// 创建新的 <a> 元素
			let newLink = document.createElement("a");

			newLink.href = darenProfileUrl.replace("{uid}",userItemList[index]['user_id']);
			newLink.target = "_blank";
			newLink.onclick = function(event) {
				event.stopPropagation();
			};
			newLink.className = "index-module__delete___zOxU1";
			newLink.setAttribute("elementtiming", "element-timing");
			newLink.setAttribute("daren-profile", "userItemList[index]['user_id']");
			newLink.textContent = "带货统计";
			// 将新的 <a> 元素追加到当前元素
			operateContainer.appendChild(newLink);
		}
	});
}

function checkDarenProfile()
{
	setInterval(function (){
		let classPrefix = "index-module__listBlock";
		let elementsWithPrefix = document.querySelectorAll('[class^="' + classPrefix + '"]');
		let pageType = getPageType();
		console.log(pageType);
		if(pageType == "dashboard-example-daren")
		{
			if(userItemList.length == 0)
			{
				let xhr = new XMLHttpRequest();
				xhr.open('GET', 'https://buyin.jinritemai.com/api/anchor/follow/get?page=1&page_size=10&show_mode=1', true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4 && xhr.status === 200) {
						let responseData = JSON.parse(xhr.responseText);
						console.log("二次请求结果：");
						userItemList = responseData.data.user_item_list;
						console.log(userItemList);
						initExampleDarenButton(elementsWithPrefix);
					}
				};
				xhr.send();
			}
			else
			{
				initExampleDarenButton(elementsWithPrefix);
			}
		}
	},3000);
}
function initSetting(callback)
{
	// 获取存储的值
	chrome.storage.local.get('nmx_buyin_setting', function (data) {
		if(callback) callback();
	});
}
// 在页面加载完成后插入弹层和引入CSS文件
window.onload = function() {
	currentUrl = window.location.href;
	if(currentUrl.includes("buyin.jinritemai.com/dashboard/servicehall/daren-profile"))
	{
		initSetting(function (){
			initPromptMessagePopup();
			initToolButton();
			addStylesheet("css/page_layer.css");
			initDarenProfile();
		});
	}
	else if(currentUrl.includes("buyin.jinritemai.com/dashboard"))
	{
		checkDarenProfile();
	}
};
/**
 * 事件监听
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	window.focus();
	console.log(message.type);
	if(message.type == 'check_mkey_complete')
	{
		activiteToolButton();
		if(message.data.hasOwnProperty("code") && message.data.code !=0)
		{
			showPromptMessagePopup(message.data.message);
		}
		else
		{
			startDownloadData();
		}
	}
});

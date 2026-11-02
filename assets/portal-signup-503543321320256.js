/*$Id: portal_signup.js,v 2314:83bc13ebe1fe 2011/08/20 06:31:21 dinesh.n $*/
'use strict';
var portal_signup = (function(){

    /* Pixel event constants */

    var PIXEL_TRACK_EVENT = 'track'; //No I18N
    var PIXEL_REGISTRATION_EVENT = 'CompleteRegistration'; //No I18N

    var loadingIcon = '<div id="zs-loader-icon" style="height: 20px;width: 20px;text-align: center; margin: 0 3px 0 10px;vertical-align: middle;"><?xml version="1.0" encoding="UTF-8"?>'+//No I18N
    '<svg enable-background="new 0 0 40 40" version="1.1" viewBox="0 0 40 40" xml:space="preserve" xmlns="ht'+'tp://www.w3.org/2000/svg">'+ //No I18N
    '    <path fill="white" d="m20.201 5.169c-8.254 0-14.946 6.692-14.946 14.946 0 8.255 6.692 14.946 14.946 14.946s14.946-6.691 14.946-14.946c-1e-3 -8.254-6.692-14.946-14.946-14.946zm0 26.58c-6.425 0-11.634-5.208-11.634-11.634 0-6.425 5.209-11.634 11.634-11.634s11.633 5.209 11.633 11.634c0 6.426-5.208 11.634-11.633 11.634z" opacity=".2"/>'+ //No I18N
    '    <path fill="white" transform="rotate(348 20 20)" d="m26.013 10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012v3.312c2.119 0 4.1 0.576 5.812 1.566z">'+ //No I18N
    '        <animateTransform attributeName="transform" attributeType="xml" dur="0.5s" from="0 20 20" repeatCount="indefinite" to="360 20 20" type="rotate"/>'+ //No I18N
    '    </path>'+//No I18N
    '</svg>';//No I18N

    var captcha_exception = false;
    function postListener (ev){
        var data = ev;
        var uri = data.uri;
        var method = data.method;
        var params = data.params;
        var handler = data.handler;
        var args = null;
        var headers = data.headers || {};
        if(data.args){
            args = data.args;
        }
        var queryStr = "";
        if(params && typeof params == "object"){
            var paramArr = new Array();
            for(var key in params){
                paramArr.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }
            if(paramArr.length > 0){
                queryStr = paramArr.join("&");
            }
        } else if(params && typeof params == "string"){
            queryStr = params;
        }

        var httpReq;
        if(window.XMLHttpRequest){
            httpReq = new XMLHttpRequest();
        } else{
            httpReq = new ActiveXObject("Microsoft.XMLHTTP");
        }
        httpReq.onreadystatechange = function(){
            if(httpReq.readyState ==4){
                if(httpReq.status == 200){
                    if(handler){
			            handler.call();
                    }
                }
                if(httpReq.status == 400){
                    if(handler){
                        var functionStr = handler + "(" + this.responseText.trim() + ")";
                        var newFunction = new Function(functionStr);
                        newFunction();
                    }
                }
            }
        }
        httpReq.open(method, uri);
        if(method != "GET"){
            httpReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            for (var h in headers) {
                httpReq.setRequestHeader(h, headers[h]);
            }
        }
        httpReq.send(queryStr);
    }

    function fnKeyDown(ev){
        var key_code = (ev.which) ? ev.which : ev.keyCode;
        if(key_code == 13 && document.getElementById("signupContinueDiv").style.display != "none"){
            ev.preventDefault();
            //ev.stopPropagation();
            signupPreConfirmation();
        }
    }

    function getSignupButton() {
        return document.querySelector('#signupDiv [type="submit"]');//NO i18N
    }

    function showLoader() {
        var btn = getSignupButton()
        var loader = btn.querySelector('#zs-loader-icon')//NO i18N
        btn.setAttribute('disabled', 'true');
        if(!loader){
            btn.innerHTML = btn.innerHTML + loadingIcon;
        }
    }

    function removeLoader() {
        var btn  = getSignupButton()
        btn.removeAttribute('disabled')
    }

    function isPixelEnabled(){
        return (typeof fbq != "undefined") ? true : false; //No I18N
    }

    function pushEventToPixel(event_type){
        if(isPixelEnabled()){
            fbq(PIXEL_TRACK_EVENT, event_type);
        }
    }

    function signupResponse (response){
	/*removeLoader()
        if(response.captchaException){
            var captcha_elm = document.getElementById("captcha_elm")
            captcha_elm.style.display = "block";
            captcha_elm.getElementsByClassName("captchaImg")[0].src=response.captchaException.captchaImageUrl;
            document.forms.portalSignUpForm.digest.value=response.captchaException.captchaDigest;
            captcha_exception = true;
            return;
        }
        if(response.error || response.status_code != 0){
            var error_code = response.error ? response.error.code:response.status_code;
            var error_msg = response.error ? response.error.message:response.developer_message;
            if(error_code == 37006){
                var otp = document.forms.portalSignUpForm.otp;
                showFieldErrorMessage(otp, i18n.get('portal.signup.otp.message'));
                otp.focus();
            } else if( error_code == 37012){
                var captchaElt = document.getElementsByClassName("captchaImg");//NO I18N
                captchaElt[0].src = response.error.captchaUrl;
                var captcha = document.forms.portalSignUpForm.captcha;
                showFieldErrorMessage(captcha, i18n.get('portal.signup.captcha.incorrect'));
                captcha.focus();
                var digestField = document.forms.portalSignUpForm.digest;
                digestField.value = response.error.captchaDigest;
            } else if( error_msg && (error_msg.indexOf("password") != -1 || error_msg.indexOf("Password") != -1)){
                var password = document.forms.portalSignUpForm.password;
                showFieldErrorMessage(password, error_msg);
                password.focus();
            } else {
                var otp = document.forms.portalSignUpForm.otp;
                if(error_code==37017) {
                    showFieldErrorMessage(otp, error_msg);
                    otp.focus();
                } else if(error_code==13032){
                    showFieldErrorMessage(otp, error_msg);
                    otp.focus();
                } else if(error_code==13021) {
                    showFieldErrorMessage(otp, error_msg);
                    otp.focus();
                } else {
                    var errorContainer = document.getElementById("signup_error_msg_container");
                    errorContainer.innerHTML = response.error.message;
                    errorContainer.style.display = "block";
                }
            }
            return;
        }
        if(response.payload.receive_promotional_emails === "1"){
            pushEventToPixel(PIXEL_REGISTRATION_EVENT);
        }
        window.open(response.payload.redirect_url, "_self");*/
    }

    window.onSignupReady = function(){
        if (!document.forms || !document.forms.signupform) {
            return;
        }
        window.loadCountryOptions=true;
        window.ZACountryCodeDetails = [{"ISO2_CODE":"AF","DIALING_CODE":93,"NEWSLETTER_MODE":0,"ISO3_CODE":"afg","DISPLAY_NAME":"Afghanistan"},{"ISO2_CODE":"AL","DIALING_CODE":355,"NEWSLETTER_MODE":0,"ISO3_CODE":"alb","DISPLAY_NAME":"Albania"},{"ISO2_CODE":"DZ","DIALING_CODE":213,"NEWSLETTER_MODE":0,"ISO3_CODE":"dza","DISPLAY_NAME":"Algeria"},{"ISO2_CODE":"AS","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"asm","DISPLAY_NAME":"American Samoa"},{"ISO2_CODE":"AD","DIALING_CODE":376,"NEWSLETTER_MODE":0,"ISO3_CODE":"and","DISPLAY_NAME":"Andorra"},{"ISO2_CODE":"AO","DIALING_CODE":244,"NEWSLETTER_MODE":0,"ISO3_CODE":"ago","DISPLAY_NAME":"Angola"},{"ISO2_CODE":"AI","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"aia","DISPLAY_NAME":"Anguilla"},{"ISO2_CODE":"AQ","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"ata","DISPLAY_NAME":"Antarctica"},{"ISO2_CODE":"AG","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"atg","DISPLAY_NAME":"Antigua and Barbuda"},{"ISO2_CODE":"AR","DIALING_CODE":54,"NEWSLETTER_MODE":0,"ISO3_CODE":"arg","DISPLAY_NAME":"Argentina"},{"ISO2_CODE":"AM","DIALING_CODE":374,"NEWSLETTER_MODE":0,"ISO3_CODE":"arm","DISPLAY_NAME":"Armenia"},{"ISO2_CODE":"AW","DIALING_CODE":297,"NEWSLETTER_MODE":0,"ISO3_CODE":"abw","DISPLAY_NAME":"Aruba"},{"ISO2_CODE":"AU","DIALING_CODE":61,"NEWSLETTER_MODE":3,"ISO3_CODE":"aus","DISPLAY_NAME":"Australia"},{"ISO2_CODE":"AT","DIALING_CODE":43,"NEWSLETTER_MODE":2,"ISO3_CODE":"aut","DISPLAY_NAME":"Austria"},{"ISO2_CODE":"AZ","DIALING_CODE":994,"NEWSLETTER_MODE":0,"ISO3_CODE":"aze","DISPLAY_NAME":"Azerbaijan"},{"ISO2_CODE":"BS","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"bhs","DISPLAY_NAME":"Bahamas"},{"ISO2_CODE":"BH","DIALING_CODE":973,"NEWSLETTER_MODE":0,"ISO3_CODE":"bhr","DISPLAY_NAME":"Bahrain"},{"ISO2_CODE":"BD","DIALING_CODE":880,"NEWSLETTER_MODE":0,"ISO3_CODE":"bgd","DISPLAY_NAME":"Bangladesh"},{"ISO2_CODE":"BB","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"brb","DISPLAY_NAME":"Barbados"},{"ISO2_CODE":"BY","DIALING_CODE":375,"NEWSLETTER_MODE":0,"ISO3_CODE":"blr","DISPLAY_NAME":"Belarus"},{"ISO2_CODE":"BE","DIALING_CODE":32,"NEWSLETTER_MODE":2,"ISO3_CODE":"bel","DISPLAY_NAME":"Belgium"},{"ISO2_CODE":"BZ","DIALING_CODE":501,"NEWSLETTER_MODE":0,"ISO3_CODE":"blz","DISPLAY_NAME":"Belize"},{"ISO2_CODE":"BJ","DIALING_CODE":229,"NEWSLETTER_MODE":0,"ISO3_CODE":"ben","DISPLAY_NAME":"Benin"},{"ISO2_CODE":"BM","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"bmu","DISPLAY_NAME":"Bermuda"},{"ISO2_CODE":"BT","DIALING_CODE":975,"NEWSLETTER_MODE":0,"ISO3_CODE":"btn","DISPLAY_NAME":"Bhutan"},{"ISO2_CODE":"BO","DIALING_CODE":591,"NEWSLETTER_MODE":0,"ISO3_CODE":"bol","DISPLAY_NAME":"Bolivia"},{"ISO2_CODE":"BQ","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"bes","DISPLAY_NAME":"Bonaire, Sint Eustatius and Saba"},{"ISO2_CODE":"BA","DIALING_CODE":387,"NEWSLETTER_MODE":0,"ISO3_CODE":"bih","DISPLAY_NAME":"Bosnia and Herzegovina"},{"ISO2_CODE":"BW","DIALING_CODE":267,"NEWSLETTER_MODE":0,"ISO3_CODE":"bwa","DISPLAY_NAME":"Botswana"},{"ISO2_CODE":"BV","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"bvt","DISPLAY_NAME":"Bouvet Island"},{"ISO2_CODE":"BR","DIALING_CODE":55,"NEWSLETTER_MODE":0,"ISO3_CODE":"bra","DISPLAY_NAME":"Brazil"},{"ISO2_CODE":"IO","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"iot","DISPLAY_NAME":"British Indian Ocean Territory"},{"ISO2_CODE":"VG","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"vgb","DISPLAY_NAME":"British Virgin Islands"},{"ISO2_CODE":"BN","DIALING_CODE":673,"NEWSLETTER_MODE":0,"ISO3_CODE":"brn","DISPLAY_NAME":"Brunei"},{"ISO2_CODE":"BG","DIALING_CODE":359,"NEWSLETTER_MODE":2,"ISO3_CODE":"bgr","DISPLAY_NAME":"Bulgaria"},{"ISO2_CODE":"BF","DIALING_CODE":226,"NEWSLETTER_MODE":0,"ISO3_CODE":"bfa","DISPLAY_NAME":"Burkina Faso"},{"ISO2_CODE":"BI","DIALING_CODE":257,"NEWSLETTER_MODE":0,"ISO3_CODE":"bdi","DISPLAY_NAME":"Burundi"},{"ISO2_CODE":"KH","DIALING_CODE":855,"NEWSLETTER_MODE":0,"ISO3_CODE":"khm","DISPLAY_NAME":"Cambodia"},{"ISO2_CODE":"CM","DIALING_CODE":237,"NEWSLETTER_MODE":0,"ISO3_CODE":"cmr","DISPLAY_NAME":"Cameroon"},{"ISO2_CODE":"CA","DIALING_CODE":1,"NEWSLETTER_MODE":2,"ISO3_CODE":"can","DISPLAY_NAME":"Canada"},{"ISO2_CODE":"CV","DIALING_CODE":238,"NEWSLETTER_MODE":0,"ISO3_CODE":"cpv","DISPLAY_NAME":"Cape Verde"},{"ISO2_CODE":"KY","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"cym","DISPLAY_NAME":"Cayman Islands"},{"ISO2_CODE":"CF","DIALING_CODE":236,"NEWSLETTER_MODE":0,"ISO3_CODE":"caf","DISPLAY_NAME":"Central African Republic"},{"ISO2_CODE":"TD","DIALING_CODE":235,"NEWSLETTER_MODE":0,"ISO3_CODE":"tcd","DISPLAY_NAME":"Chad"},{"ISO2_CODE":"CL","DIALING_CODE":56,"NEWSLETTER_MODE":0,"ISO3_CODE":"chl","DISPLAY_NAME":"Chile"},{"ISO2_CODE":"CN","DIALING_CODE":86,"NEWSLETTER_MODE":0,"ISO3_CODE":"chn","DISPLAY_NAME":"China"},{"ISO2_CODE":"CX","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"cxr","DISPLAY_NAME":"Christmas Island"},{"ISO2_CODE":"CC","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"cck","DISPLAY_NAME":"Cocos Islands"},{"ISO2_CODE":"CO","DIALING_CODE":57,"NEWSLETTER_MODE":0,"ISO3_CODE":"col","DISPLAY_NAME":"Colombia"},{"ISO2_CODE":"KM","DIALING_CODE":269,"NEWSLETTER_MODE":0,"ISO3_CODE":"com","DISPLAY_NAME":"Comoros"},{"ISO2_CODE":"CG","DIALING_CODE":242,"NEWSLETTER_MODE":0,"ISO3_CODE":"cog","DISPLAY_NAME":"Congo"},{"ISO2_CODE":"CK","DIALING_CODE":682,"NEWSLETTER_MODE":0,"ISO3_CODE":"cok","DISPLAY_NAME":"Cook Islands"},{"ISO2_CODE":"CR","DIALING_CODE":506,"NEWSLETTER_MODE":0,"ISO3_CODE":"cri","DISPLAY_NAME":"Costa Rica"},{"ISO2_CODE":"HR","DIALING_CODE":385,"NEWSLETTER_MODE":2,"ISO3_CODE":"hrv","DISPLAY_NAME":"Croatia"},{"ISO2_CODE":"CU","DIALING_CODE":53,"NEWSLETTER_MODE":0,"ISO3_CODE":"cub","DISPLAY_NAME":"Cuba"},{"ISO2_CODE":"CW","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"cuw","DISPLAY_NAME":"Curaçao"},{"ISO2_CODE":"CY","DIALING_CODE":357,"NEWSLETTER_MODE":2,"ISO3_CODE":"cyp","DISPLAY_NAME":"Cyprus"},{"ISO2_CODE":"CZ","DIALING_CODE":420,"NEWSLETTER_MODE":2,"ISO3_CODE":"cze","DISPLAY_NAME":"Czech Republic"},{"ISO2_CODE":"CI","DIALING_CODE":225,"NEWSLETTER_MODE":0,"ISO3_CODE":"civ","DISPLAY_NAME":"Côte d'Ivoire"},{"ISO2_CODE":"DK","DIALING_CODE":45,"NEWSLETTER_MODE":2,"ISO3_CODE":"dnk","DISPLAY_NAME":"Denmark"},{"ISO2_CODE":"DJ","DIALING_CODE":253,"NEWSLETTER_MODE":0,"ISO3_CODE":"dji","DISPLAY_NAME":"Djibouti"},{"ISO2_CODE":"DM","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"dma","DISPLAY_NAME":"Dominica"},{"ISO2_CODE":"DO","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"dom","DISPLAY_NAME":"Dominican Republic"},{"ISO2_CODE":"EC","DIALING_CODE":593,"NEWSLETTER_MODE":0,"ISO3_CODE":"ecu","DISPLAY_NAME":"Ecuador"},{"ISO2_CODE":"EG","DIALING_CODE":20,"NEWSLETTER_MODE":0,"ISO3_CODE":"egy","DISPLAY_NAME":"Egypt"},{"ISO2_CODE":"SV","DIALING_CODE":503,"NEWSLETTER_MODE":0,"ISO3_CODE":"slv","DISPLAY_NAME":"El Salvador"},{"ISO2_CODE":"GQ","DIALING_CODE":240,"NEWSLETTER_MODE":0,"ISO3_CODE":"gnq","DISPLAY_NAME":"Equatorial Guinea"},{"ISO2_CODE":"ER","DIALING_CODE":291,"NEWSLETTER_MODE":0,"ISO3_CODE":"eri","DISPLAY_NAME":"Eritrea"},{"ISO2_CODE":"EE","DIALING_CODE":372,"NEWSLETTER_MODE":1,"ISO3_CODE":"est","DISPLAY_NAME":"Estonia"},{"ISO2_CODE":"ET","DIALING_CODE":251,"NEWSLETTER_MODE":0,"ISO3_CODE":"eth","DISPLAY_NAME":"Ethiopia"},{"ISO2_CODE":"FK","DIALING_CODE":500,"NEWSLETTER_MODE":0,"ISO3_CODE":"flk","DISPLAY_NAME":"Falkland Islands"},{"ISO2_CODE":"FO","DIALING_CODE":298,"NEWSLETTER_MODE":0,"ISO3_CODE":"fro","DISPLAY_NAME":"Faroe Islands"},{"ISO2_CODE":"FJ","DIALING_CODE":679,"NEWSLETTER_MODE":0,"ISO3_CODE":"fji","DISPLAY_NAME":"Fiji"},{"ISO2_CODE":"FI","DIALING_CODE":358,"NEWSLETTER_MODE":1,"ISO3_CODE":"fin","DISPLAY_NAME":"Finland"},{"ISO2_CODE":"FR","DIALING_CODE":33,"NEWSLETTER_MODE":1,"ISO3_CODE":"fra","DISPLAY_NAME":"France"},{"ISO2_CODE":"GF","DIALING_CODE":594,"NEWSLETTER_MODE":0,"ISO3_CODE":"guf","DISPLAY_NAME":"French Guiana"},{"ISO2_CODE":"PF","DIALING_CODE":689,"NEWSLETTER_MODE":0,"ISO3_CODE":"pyf","DISPLAY_NAME":"French Polynesia"},{"ISO2_CODE":"TF","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"atf","DISPLAY_NAME":"French Southern Territories"},{"ISO2_CODE":"GA","DIALING_CODE":241,"NEWSLETTER_MODE":0,"ISO3_CODE":"gab","DISPLAY_NAME":"Gabon"},{"ISO2_CODE":"GM","DIALING_CODE":220,"NEWSLETTER_MODE":0,"ISO3_CODE":"gmb","DISPLAY_NAME":"Gambia"},{"ISO2_CODE":"GE","DIALING_CODE":995,"NEWSLETTER_MODE":0,"ISO3_CODE":"geo","DISPLAY_NAME":"Georgia"},{"ISO2_CODE":"DE","DIALING_CODE":49,"NEWSLETTER_MODE":3,"ISO3_CODE":"deu","DISPLAY_NAME":"Germany"},{"ISO2_CODE":"GH","DIALING_CODE":233,"NEWSLETTER_MODE":0,"ISO3_CODE":"gha","DISPLAY_NAME":"Ghana"},{"ISO2_CODE":"GI","DIALING_CODE":350,"NEWSLETTER_MODE":0,"ISO3_CODE":"gib","DISPLAY_NAME":"Gibraltar"},{"ISO2_CODE":"GR","DIALING_CODE":30,"NEWSLETTER_MODE":2,"ISO3_CODE":"grc","DISPLAY_NAME":"Greece"},{"ISO2_CODE":"GL","DIALING_CODE":299,"NEWSLETTER_MODE":0,"ISO3_CODE":"grl","DISPLAY_NAME":"Greenland"},{"ISO2_CODE":"GD","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"grd","DISPLAY_NAME":"Grenada"},{"ISO2_CODE":"GP","DIALING_CODE":590,"NEWSLETTER_MODE":0,"ISO3_CODE":"glp","DISPLAY_NAME":"Guadeloupe"},{"ISO2_CODE":"GU","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"gum","DISPLAY_NAME":"Guam"},{"ISO2_CODE":"GT","DIALING_CODE":502,"NEWSLETTER_MODE":0,"ISO3_CODE":"gtm","DISPLAY_NAME":"Guatemala"},{"ISO2_CODE":"GG","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"ggy","DISPLAY_NAME":"Guernsey"},{"ISO2_CODE":"GN","DIALING_CODE":224,"NEWSLETTER_MODE":0,"ISO3_CODE":"gin","DISPLAY_NAME":"Guinea"},{"ISO2_CODE":"GW","DIALING_CODE":245,"NEWSLETTER_MODE":0,"ISO3_CODE":"gnb","DISPLAY_NAME":"Guinea-Bissau"},{"ISO2_CODE":"GY","DIALING_CODE":592,"NEWSLETTER_MODE":0,"ISO3_CODE":"guy","DISPLAY_NAME":"Guyana"},{"ISO2_CODE":"HT","DIALING_CODE":509,"NEWSLETTER_MODE":0,"ISO3_CODE":"hti","DISPLAY_NAME":"Haiti"},{"ISO2_CODE":"HM","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"hmd","DISPLAY_NAME":"Heard Island And McDonald Islands"},{"ISO2_CODE":"HN","DIALING_CODE":504,"NEWSLETTER_MODE":0,"ISO3_CODE":"hnd","DISPLAY_NAME":"Honduras"},{"ISO2_CODE":"HK","DIALING_CODE":852,"NEWSLETTER_MODE":0,"ISO3_CODE":"hkg","DISPLAY_NAME":"Hong Kong"},{"ISO2_CODE":"HU","DIALING_CODE":36,"NEWSLETTER_MODE":1,"ISO3_CODE":"hun","DISPLAY_NAME":"Hungary"},{"ISO2_CODE":"IS","DIALING_CODE":354,"NEWSLETTER_MODE":2,"ISO3_CODE":"isl","DISPLAY_NAME":"Iceland"},{"ISO2_CODE":"IN","DIALING_CODE":91,"NEWSLETTER_MODE":0,"ISO3_CODE":"ind","DISPLAY_NAME":"India"},{"ISO2_CODE":"ID","DIALING_CODE":62,"NEWSLETTER_MODE":0,"ISO3_CODE":"idn","DISPLAY_NAME":"Indonesia"},{"ISO2_CODE":"IR","DIALING_CODE":98,"NEWSLETTER_MODE":0,"ISO3_CODE":"irn","DISPLAY_NAME":"Iran"},{"ISO2_CODE":"IQ","DIALING_CODE":964,"NEWSLETTER_MODE":0,"ISO3_CODE":"irq","DISPLAY_NAME":"Iraq"},{"ISO2_CODE":"IE","DIALING_CODE":353,"NEWSLETTER_MODE":1,"ISO3_CODE":"irl","DISPLAY_NAME":"Ireland"},{"ISO2_CODE":"IM","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"imn","DISPLAY_NAME":"Isle Of Man"},{"ISO2_CODE":"IL","DIALING_CODE":972,"NEWSLETTER_MODE":0,"ISO3_CODE":"isr","DISPLAY_NAME":"Israel"},{"ISO2_CODE":"IT","DIALING_CODE":39,"NEWSLETTER_MODE":2,"ISO3_CODE":"ita","DISPLAY_NAME":"Italy"},{"ISO2_CODE":"JM","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"jam","DISPLAY_NAME":"Jamaica"},{"ISO2_CODE":"JP","DIALING_CODE":81,"NEWSLETTER_MODE":0,"ISO3_CODE":"jpn","DISPLAY_NAME":"Japan"},{"ISO2_CODE":"JE","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"jey","DISPLAY_NAME":"Jersey"},{"ISO2_CODE":"JO","DIALING_CODE":962,"NEWSLETTER_MODE":0,"ISO3_CODE":"jor","DISPLAY_NAME":"Jordan"},{"ISO2_CODE":"KZ","DIALING_CODE":7,"NEWSLETTER_MODE":0,"ISO3_CODE":"kaz","DISPLAY_NAME":"Kazakhstan"},{"ISO2_CODE":"KE","DIALING_CODE":254,"NEWSLETTER_MODE":0,"ISO3_CODE":"ken","DISPLAY_NAME":"Kenya"},{"ISO2_CODE":"KI","DIALING_CODE":686,"NEWSLETTER_MODE":0,"ISO3_CODE":"kir","DISPLAY_NAME":"Kiribati"},{"ISO2_CODE":"XK","DIALING_CODE":383,"NEWSLETTER_MODE":0,"ISO3_CODE":"rks","DISPLAY_NAME":"Kosovo"},{"ISO2_CODE":"KW","DIALING_CODE":965,"NEWSLETTER_MODE":0,"ISO3_CODE":"kwt","DISPLAY_NAME":"Kuwait"},{"ISO2_CODE":"KG","DIALING_CODE":996,"NEWSLETTER_MODE":0,"ISO3_CODE":"kgz","DISPLAY_NAME":"Kyrgyzstan"},{"ISO2_CODE":"LA","DIALING_CODE":856,"NEWSLETTER_MODE":0,"ISO3_CODE":"lao","DISPLAY_NAME":"Laos"},{"ISO2_CODE":"LV","DIALING_CODE":371,"NEWSLETTER_MODE":1,"ISO3_CODE":"lva","DISPLAY_NAME":"Latvia"},{"ISO2_CODE":"LB","DIALING_CODE":961,"NEWSLETTER_MODE":0,"ISO3_CODE":"lbn","DISPLAY_NAME":"Lebanon"},{"ISO2_CODE":"LS","DIALING_CODE":266,"NEWSLETTER_MODE":0,"ISO3_CODE":"lso","DISPLAY_NAME":"Lesotho"},{"ISO2_CODE":"LR","DIALING_CODE":231,"NEWSLETTER_MODE":0,"ISO3_CODE":"lbr","DISPLAY_NAME":"Liberia"},{"ISO2_CODE":"LY","DIALING_CODE":218,"NEWSLETTER_MODE":0,"ISO3_CODE":"lby","DISPLAY_NAME":"Libya"},{"ISO2_CODE":"LI","DIALING_CODE":423,"NEWSLETTER_MODE":0,"ISO3_CODE":"lie","DISPLAY_NAME":"Liechtenstein"},{"ISO2_CODE":"LT","DIALING_CODE":370,"NEWSLETTER_MODE":2,"ISO3_CODE":"ltu","DISPLAY_NAME":"Lithuania"},{"ISO2_CODE":"LU","DIALING_CODE":352,"NEWSLETTER_MODE":1,"ISO3_CODE":"lux","DISPLAY_NAME":"Luxembourg"},{"ISO2_CODE":"MO","DIALING_CODE":853,"NEWSLETTER_MODE":0,"ISO3_CODE":"mac","DISPLAY_NAME":"Macao"},{"ISO2_CODE":"MK","DIALING_CODE":389,"NEWSLETTER_MODE":0,"ISO3_CODE":"mkd","DISPLAY_NAME":"Macedonia"},{"ISO2_CODE":"MG","DIALING_CODE":261,"NEWSLETTER_MODE":0,"ISO3_CODE":"mdg","DISPLAY_NAME":"Madagascar"},{"ISO2_CODE":"MW","DIALING_CODE":265,"NEWSLETTER_MODE":0,"ISO3_CODE":"mwi","DISPLAY_NAME":"Malawi"},{"ISO2_CODE":"MY","DIALING_CODE":60,"NEWSLETTER_MODE":0,"ISO3_CODE":"mys","DISPLAY_NAME":"Malaysia"},{"ISO2_CODE":"MV","DIALING_CODE":960,"NEWSLETTER_MODE":0,"ISO3_CODE":"mdv","DISPLAY_NAME":"Maldives"},{"ISO2_CODE":"ML","DIALING_CODE":223,"NEWSLETTER_MODE":0,"ISO3_CODE":"mli","DISPLAY_NAME":"Mali"},{"ISO2_CODE":"MT","DIALING_CODE":356,"NEWSLETTER_MODE":2,"ISO3_CODE":"mlt","DISPLAY_NAME":"Malta"},{"ISO2_CODE":"MH","DIALING_CODE":692,"NEWSLETTER_MODE":0,"ISO3_CODE":"mhl","DISPLAY_NAME":"Marshall Islands"},{"ISO2_CODE":"MQ","DIALING_CODE":596,"NEWSLETTER_MODE":0,"ISO3_CODE":"mtq","DISPLAY_NAME":"Martinique"},{"ISO2_CODE":"MR","DIALING_CODE":222,"NEWSLETTER_MODE":0,"ISO3_CODE":"mrt","DISPLAY_NAME":"Mauritania"},{"ISO2_CODE":"MU","DIALING_CODE":230,"NEWSLETTER_MODE":0,"ISO3_CODE":"mus","DISPLAY_NAME":"Mauritius"},{"ISO2_CODE":"YT","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"myt","DISPLAY_NAME":"Mayotte"},{"ISO2_CODE":"MX","DIALING_CODE":52,"NEWSLETTER_MODE":0,"ISO3_CODE":"mex","DISPLAY_NAME":"Mexico"},{"ISO2_CODE":"FM","DIALING_CODE":691,"NEWSLETTER_MODE":0,"ISO3_CODE":"fsm","DISPLAY_NAME":"Micronesia"},{"ISO2_CODE":"MD","DIALING_CODE":373,"NEWSLETTER_MODE":0,"ISO3_CODE":"mda","DISPLAY_NAME":"Moldova"},{"ISO2_CODE":"MC","DIALING_CODE":377,"NEWSLETTER_MODE":0,"ISO3_CODE":"mco","DISPLAY_NAME":"Monaco"},{"ISO2_CODE":"MN","DIALING_CODE":976,"NEWSLETTER_MODE":0,"ISO3_CODE":"mng","DISPLAY_NAME":"Mongolia"},{"ISO2_CODE":"ME","DIALING_CODE":382,"NEWSLETTER_MODE":0,"ISO3_CODE":"mne","DISPLAY_NAME":"Montenegro"},{"ISO2_CODE":"MS","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"msr","DISPLAY_NAME":"Montserrat"},{"ISO2_CODE":"MA","DIALING_CODE":212,"NEWSLETTER_MODE":0,"ISO3_CODE":"mar","DISPLAY_NAME":"Morocco"},{"ISO2_CODE":"MZ","DIALING_CODE":258,"NEWSLETTER_MODE":0,"ISO3_CODE":"moz","DISPLAY_NAME":"Mozambique"},{"ISO2_CODE":"MM","DIALING_CODE":95,"NEWSLETTER_MODE":0,"ISO3_CODE":"mmr","DISPLAY_NAME":"Myanmar"},{"ISO2_CODE":"NA","DIALING_CODE":264,"NEWSLETTER_MODE":0,"ISO3_CODE":"nam","DISPLAY_NAME":"Namibia"},{"ISO2_CODE":"NR","DIALING_CODE":674,"NEWSLETTER_MODE":0,"ISO3_CODE":"nru","DISPLAY_NAME":"Nauru"},{"ISO2_CODE":"NP","DIALING_CODE":977,"NEWSLETTER_MODE":0,"ISO3_CODE":"npl","DISPLAY_NAME":"Nepal"},{"ISO2_CODE":"NL","DIALING_CODE":31,"NEWSLETTER_MODE":2,"ISO3_CODE":"nld","DISPLAY_NAME":"Netherlands"},{"ISO2_CODE":"AN","DIALING_CODE":599,"NEWSLETTER_MODE":0,"ISO3_CODE":"ant","DISPLAY_NAME":"Netherlands Antilles"},{"ISO2_CODE":"NC","DIALING_CODE":687,"NEWSLETTER_MODE":0,"ISO3_CODE":"ncl","DISPLAY_NAME":"New Caledonia"},{"ISO2_CODE":"NZ","DIALING_CODE":64,"NEWSLETTER_MODE":0,"ISO3_CODE":"nzl","DISPLAY_NAME":"New Zealand"},{"ISO2_CODE":"NI","DIALING_CODE":505,"NEWSLETTER_MODE":0,"ISO3_CODE":"nic","DISPLAY_NAME":"Nicaragua"},{"ISO2_CODE":"NE","DIALING_CODE":227,"NEWSLETTER_MODE":0,"ISO3_CODE":"ner","DISPLAY_NAME":"Niger"},{"ISO2_CODE":"NG","DIALING_CODE":234,"NEWSLETTER_MODE":0,"ISO3_CODE":"nga","DISPLAY_NAME":"Nigeria"},{"ISO2_CODE":"NU","DIALING_CODE":683,"NEWSLETTER_MODE":0,"ISO3_CODE":"niu","DISPLAY_NAME":"Niue"},{"ISO2_CODE":"NF","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"nfk","DISPLAY_NAME":"Norfolk Island"},{"ISO2_CODE":"KP","DIALING_CODE":850,"NEWSLETTER_MODE":0,"ISO3_CODE":"prk","DISPLAY_NAME":"North Korea"},{"ISO2_CODE":"MP","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"mnp","DISPLAY_NAME":"Northern Mariana Islands"},{"ISO2_CODE":"NO","DIALING_CODE":47,"NEWSLETTER_MODE":2,"ISO3_CODE":"nor","DISPLAY_NAME":"Norway"},{"ISO2_CODE":"OM","DIALING_CODE":968,"NEWSLETTER_MODE":0,"ISO3_CODE":"omn","DISPLAY_NAME":"Oman"},{"ISO2_CODE":"PK","DIALING_CODE":92,"NEWSLETTER_MODE":0,"ISO3_CODE":"pak","DISPLAY_NAME":"Pakistan"},{"ISO2_CODE":"PW","DIALING_CODE":680,"NEWSLETTER_MODE":0,"ISO3_CODE":"plw","DISPLAY_NAME":"Palau"},{"ISO2_CODE":"PS","DIALING_CODE":970,"NEWSLETTER_MODE":0,"ISO3_CODE":"pse","DISPLAY_NAME":"Palestine"},{"ISO2_CODE":"PA","DIALING_CODE":507,"NEWSLETTER_MODE":0,"ISO3_CODE":"pan","DISPLAY_NAME":"Panama"},{"ISO2_CODE":"PG","DIALING_CODE":675,"NEWSLETTER_MODE":0,"ISO3_CODE":"png","DISPLAY_NAME":"Papua New Guinea"},{"ISO2_CODE":"PY","DIALING_CODE":595,"NEWSLETTER_MODE":0,"ISO3_CODE":"pry","DISPLAY_NAME":"Paraguay"},{"ISO2_CODE":"PE","DIALING_CODE":51,"NEWSLETTER_MODE":0,"ISO3_CODE":"per","DISPLAY_NAME":"Peru"},{"ISO2_CODE":"PH","DIALING_CODE":63,"NEWSLETTER_MODE":0,"ISO3_CODE":"phl","DISPLAY_NAME":"Philippines"},{"ISO2_CODE":"PN","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"pcn","DISPLAY_NAME":"Pitcairn"},{"ISO2_CODE":"PL","DIALING_CODE":48,"NEWSLETTER_MODE":2,"ISO3_CODE":"pol","DISPLAY_NAME":"Poland"},{"ISO2_CODE":"PT","DIALING_CODE":351,"NEWSLETTER_MODE":1,"ISO3_CODE":"prt","DISPLAY_NAME":"Portugal"},{"ISO2_CODE":"PR","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"pri","DISPLAY_NAME":"Puerto Rico"},{"ISO2_CODE":"QA","DIALING_CODE":974,"NEWSLETTER_MODE":0,"ISO3_CODE":"qat","DISPLAY_NAME":"Qatar"},{"ISO2_CODE":"RE","DIALING_CODE":262,"NEWSLETTER_MODE":0,"ISO3_CODE":"reu","DISPLAY_NAME":"Reunion"},{"ISO2_CODE":"RO","DIALING_CODE":40,"NEWSLETTER_MODE":2,"ISO3_CODE":"rou","DISPLAY_NAME":"Romania"},{"ISO2_CODE":"RU","DIALING_CODE":7,"NEWSLETTER_MODE":0,"ISO3_CODE":"rus","DISPLAY_NAME":"Russia"},{"ISO2_CODE":"RW","DIALING_CODE":250,"NEWSLETTER_MODE":0,"ISO3_CODE":"rwa","DISPLAY_NAME":"Rwanda"},{"ISO2_CODE":"BL","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"blm","DISPLAY_NAME":"Saint Barthélemy"},{"ISO2_CODE":"SH","DIALING_CODE":290,"NEWSLETTER_MODE":0,"ISO3_CODE":"shn","DISPLAY_NAME":"Saint Helena"},{"ISO2_CODE":"KN","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"kna","DISPLAY_NAME":"Saint Kitts And Nevis"},{"ISO2_CODE":"LC","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"lca","DISPLAY_NAME":"Saint Lucia"},{"ISO2_CODE":"MF","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"maf","DISPLAY_NAME":"Saint Martin"},{"ISO2_CODE":"PM","DIALING_CODE":508,"NEWSLETTER_MODE":0,"ISO3_CODE":"spm","DISPLAY_NAME":"Saint Pierre And Miquelon"},{"ISO2_CODE":"VC","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"vct","DISPLAY_NAME":"Saint Vincent And The Grenadines"},{"ISO2_CODE":"WS","DIALING_CODE":685,"NEWSLETTER_MODE":0,"ISO3_CODE":"wsm","DISPLAY_NAME":"Samoa"},{"ISO2_CODE":"SM","DIALING_CODE":378,"NEWSLETTER_MODE":0,"ISO3_CODE":"smr","DISPLAY_NAME":"San Marino"},{"ISO2_CODE":"ST","DIALING_CODE":239,"NEWSLETTER_MODE":0,"ISO3_CODE":"stp","DISPLAY_NAME":"Sao Tome And Principe"},{"ISO2_CODE":"SA","DIALING_CODE":966,"NEWSLETTER_MODE":0,"ISO3_CODE":"sau","DISPLAY_NAME":"Saudi Arabia"},{"ISO2_CODE":"SN","DIALING_CODE":221,"NEWSLETTER_MODE":0,"ISO3_CODE":"sen","DISPLAY_NAME":"Senegal"},{"ISO2_CODE":"RS","DIALING_CODE":381,"NEWSLETTER_MODE":0,"ISO3_CODE":"srb","DISPLAY_NAME":"Serbia"},{"ISO2_CODE":"SC","DIALING_CODE":248,"NEWSLETTER_MODE":0,"ISO3_CODE":"syc","DISPLAY_NAME":"Seychelles"},{"ISO2_CODE":"SL","DIALING_CODE":232,"NEWSLETTER_MODE":0,"ISO3_CODE":"sle","DISPLAY_NAME":"Sierra Leone"},{"ISO2_CODE":"SG","DIALING_CODE":65,"NEWSLETTER_MODE":0,"ISO3_CODE":"sgp","DISPLAY_NAME":"Singapore"},{"ISO2_CODE":"SX","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"sxm","DISPLAY_NAME":"Sint Maarten (Dutch part)"},{"ISO2_CODE":"SK","DIALING_CODE":421,"NEWSLETTER_MODE":2,"ISO3_CODE":"svk","DISPLAY_NAME":"Slovakia"},{"ISO2_CODE":"SI","DIALING_CODE":386,"NEWSLETTER_MODE":1,"ISO3_CODE":"svn","DISPLAY_NAME":"Slovenia"},{"ISO2_CODE":"SB","DIALING_CODE":677,"NEWSLETTER_MODE":0,"ISO3_CODE":"slb","DISPLAY_NAME":"Solomon Islands"},{"ISO2_CODE":"SO","DIALING_CODE":252,"NEWSLETTER_MODE":0,"ISO3_CODE":"som","DISPLAY_NAME":"Somalia"},{"ISO2_CODE":"ZA","DIALING_CODE":27,"NEWSLETTER_MODE":0,"ISO3_CODE":"zaf","DISPLAY_NAME":"South Africa"},{"ISO2_CODE":"GS","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"sgs","DISPLAY_NAME":"South Georgia And The South Sandwich Islands"},{"ISO2_CODE":"KR","DIALING_CODE":82,"NEWSLETTER_MODE":0,"ISO3_CODE":"kor","DISPLAY_NAME":"South Korea"},{"ISO2_CODE":"SS","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"ssd","DISPLAY_NAME":"South Sudan"},{"ISO2_CODE":"ES","DIALING_CODE":34,"NEWSLETTER_MODE":2,"ISO3_CODE":"esp","DISPLAY_NAME":"Spain"},{"ISO2_CODE":"LK","DIALING_CODE":94,"NEWSLETTER_MODE":0,"ISO3_CODE":"lka","DISPLAY_NAME":"Sri Lanka"},{"ISO2_CODE":"SD","DIALING_CODE":249,"NEWSLETTER_MODE":0,"ISO3_CODE":"sdn","DISPLAY_NAME":"Sudan"},{"ISO2_CODE":"SR","DIALING_CODE":597,"NEWSLETTER_MODE":0,"ISO3_CODE":"sur","DISPLAY_NAME":"Suriname"},{"ISO2_CODE":"SJ","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"sjm","DISPLAY_NAME":"Svalbard And Jan Mayen"},{"ISO2_CODE":"SZ","DIALING_CODE":268,"NEWSLETTER_MODE":0,"ISO3_CODE":"swz","DISPLAY_NAME":"Swaziland"},{"ISO2_CODE":"SE","DIALING_CODE":46,"NEWSLETTER_MODE":1,"ISO3_CODE":"swe","DISPLAY_NAME":"Sweden"},{"ISO2_CODE":"CH","DIALING_CODE":41,"NEWSLETTER_MODE":2,"ISO3_CODE":"che","DISPLAY_NAME":"Switzerland"},{"ISO2_CODE":"SY","DIALING_CODE":963,"NEWSLETTER_MODE":0,"ISO3_CODE":"syr","DISPLAY_NAME":"Syria"},{"ISO2_CODE":"TW","DIALING_CODE":886,"NEWSLETTER_MODE":0,"ISO3_CODE":"twn","DISPLAY_NAME":"Taiwan"},{"ISO2_CODE":"TJ","DIALING_CODE":992,"NEWSLETTER_MODE":0,"ISO3_CODE":"tjk","DISPLAY_NAME":"Tajikistan"},{"ISO2_CODE":"TZ","DIALING_CODE":255,"NEWSLETTER_MODE":0,"ISO3_CODE":"tza","DISPLAY_NAME":"Tanzania"},{"ISO2_CODE":"TH","DIALING_CODE":66,"NEWSLETTER_MODE":0,"ISO3_CODE":"tha","DISPLAY_NAME":"Thailand"},{"ISO2_CODE":"CD","DIALING_CODE":243,"NEWSLETTER_MODE":0,"ISO3_CODE":"cod","DISPLAY_NAME":"The Democratic Republic Of Congo"},{"ISO2_CODE":"TL","DIALING_CODE":670,"NEWSLETTER_MODE":0,"ISO3_CODE":"tls","DISPLAY_NAME":"Timor-Leste"},{"ISO2_CODE":"TG","DIALING_CODE":228,"NEWSLETTER_MODE":0,"ISO3_CODE":"tgo","DISPLAY_NAME":"Togo"},{"ISO2_CODE":"TK","DIALING_CODE":690,"NEWSLETTER_MODE":0,"ISO3_CODE":"tkl","DISPLAY_NAME":"Tokelau"},{"ISO2_CODE":"TO","DIALING_CODE":676,"NEWSLETTER_MODE":0,"ISO3_CODE":"ton","DISPLAY_NAME":"Tonga"},{"ISO2_CODE":"TT","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"tto","DISPLAY_NAME":"Trinidad and Tobago"},{"ISO2_CODE":"TN","DIALING_CODE":216,"NEWSLETTER_MODE":0,"ISO3_CODE":"tun","DISPLAY_NAME":"Tunisia"},{"ISO2_CODE":"TR","DIALING_CODE":90,"NEWSLETTER_MODE":0,"ISO3_CODE":"tur","DISPLAY_NAME":"Turkey"},{"ISO2_CODE":"TM","DIALING_CODE":993,"NEWSLETTER_MODE":0,"ISO3_CODE":"tkm","DISPLAY_NAME":"Turkmenistan"},{"ISO2_CODE":"TC","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"tca","DISPLAY_NAME":"Turks And Caicos Islands"},{"ISO2_CODE":"TV","DIALING_CODE":688,"NEWSLETTER_MODE":0,"ISO3_CODE":"tuv","DISPLAY_NAME":"Tuvalu"},{"ISO2_CODE":"VI","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"vir","DISPLAY_NAME":"U.S. Virgin Islands"},{"ISO2_CODE":"UG","DIALING_CODE":256,"NEWSLETTER_MODE":0,"ISO3_CODE":"uga","DISPLAY_NAME":"Uganda"},{"ISO2_CODE":"UA","DIALING_CODE":380,"NEWSLETTER_MODE":0,"ISO3_CODE":"ukr","DISPLAY_NAME":"Ukraine"},{"ISO2_CODE":"AE","DIALING_CODE":971,"NEWSLETTER_MODE":0,"ISO3_CODE":"are","DISPLAY_NAME":"United Arab Emirates"},{"ISO2_CODE":"GB","DIALING_CODE":44,"NEWSLETTER_MODE":1,"ISO3_CODE":"gbr","DISPLAY_NAME":"United Kingdom"},{"ISO2_CODE":"US","DIALING_CODE":1,"NEWSLETTER_MODE":0,"ISO3_CODE":"usa","DISPLAY_NAME":"United States"},{"ISO2_CODE":"UM","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"umi","DISPLAY_NAME":"United States Minor Outlying Islands"},{"ISO2_CODE":"UY","DIALING_CODE":598,"NEWSLETTER_MODE":0,"ISO3_CODE":"ury","DISPLAY_NAME":"Uruguay"},{"ISO2_CODE":"UZ","DIALING_CODE":998,"NEWSLETTER_MODE":0,"ISO3_CODE":"uzb","DISPLAY_NAME":"Uzbekistan"},{"ISO2_CODE":"VU","DIALING_CODE":678,"NEWSLETTER_MODE":0,"ISO3_CODE":"vut","DISPLAY_NAME":"Vanuatu"},{"ISO2_CODE":"VA","DIALING_CODE":379,"NEWSLETTER_MODE":0,"ISO3_CODE":"vat","DISPLAY_NAME":"Vatican"},{"ISO2_CODE":"VE","DIALING_CODE":58,"NEWSLETTER_MODE":0,"ISO3_CODE":"ven","DISPLAY_NAME":"Venezuela"},{"ISO2_CODE":"VN","DIALING_CODE":84,"NEWSLETTER_MODE":0,"ISO3_CODE":"vnm","DISPLAY_NAME":"Vietnam"},{"ISO2_CODE":"WF","DIALING_CODE":681,"NEWSLETTER_MODE":0,"ISO3_CODE":"wlf","DISPLAY_NAME":"Wallis And Futuna"},{"ISO2_CODE":"EH","DIALING_CODE":-1,"NEWSLETTER_MODE":-1,"ISO3_CODE":"esh","DISPLAY_NAME":"Western Sahara"},{"ISO2_CODE":"YE","DIALING_CODE":967,"NEWSLETTER_MODE":0,"ISO3_CODE":"yem","DISPLAY_NAME":"Yemen"},{"ISO2_CODE":"ZM","DIALING_CODE":260,"NEWSLETTER_MODE":0,"ISO3_CODE":"zmb","DISPLAY_NAME":"Zambia"},{"ISO2_CODE":"ZW","DIALING_CODE":263,"NEWSLETTER_MODE":0,"ISO3_CODE":"zwe","DISPLAY_NAME":"Zimbabwe"},{"ISO2_CODE":"AX","DIALING_CODE":672,"NEWSLETTER_MODE":0,"ISO3_CODE":"ala","DISPLAY_NAME":"Åland Islands"}]; //NO I18N
        window.ZADefaultCountry = 'IN';//NO I18N
        window.ZACountryStateDetails = [{"us":"<option value=\"Alabama\">Alabama<\/option><option value=\"Alaska\">Alaska<\/option><option value=\"Arizona\">Arizona<\/option><option value=\"Arkansas\">Arkansas<\/option><option value=\"California\">California<\/option><option value=\"Colorado\">Colorado<\/option><option value=\"Connecticut\">Connecticut<\/option><option value=\"Delaware\">Delaware<\/option><option value=\"District of Columbia\">District of Columbia<\/option><option value=\"Florida\">Florida<\/option><option value=\"Georgia\">Georgia<\/option><option value=\"Hawaii\">Hawaii<\/option><option value=\"Idaho\">Idaho<\/option><option value=\"Illinois\">Illinois<\/option><option value=\"Indiana\">Indiana<\/option><option value=\"Iowa\">Iowa<\/option><option value=\"Kansas\">Kansas<\/option><option value=\"Kentucky\">Kentucky<\/option><option value=\"Louisiana\">Louisiana<\/option><option value=\"Maine\">Maine<\/option><option value=\"Maryland\">Maryland<\/option><option value=\"Massachusetts\">Massachusetts<\/option><option value=\"Michigan\">Michigan<\/option><option value=\"Minnesota\">Minnesota<\/option><option value=\"Mississippi\">Mississippi<\/option><option value=\"Missouri\">Missouri<\/option><option value=\"Montana\">Montana<\/option><option value=\"Nebraska\">Nebraska<\/option><option value=\"Nevada\">Nevada<\/option><option value=\"New Hampshire\">New Hampshire<\/option><option value=\"New Jersey\">New Jersey<\/option><option value=\"New Mexico\">New Mexico<\/option><option value=\"New York\">New York<\/option><option value=\"North Carolina\">North Carolina<\/option><option value=\"North Dakota\">North Dakota<\/option><option value=\"Ohio\">Ohio<\/option><option value=\"Oklahoma\">Oklahoma<\/option><option value=\"Oregon\">Oregon<\/option><option value=\"Pennsylvania\">Pennsylvania<\/option><option value=\"Rhode Island\">Rhode Island<\/option><option value=\"South Carolina\">South Carolina<\/option><option value=\"South Dakota\">South Dakota<\/option><option value=\"Tennessee\">Tennessee<\/option><option value=\"Texas\">Texas<\/option><option value=\"Utah\">Utah<\/option><option value=\"Vermont\">Vermont<\/option><option value=\"Virginia\">Virginia<\/option><option value=\"Washington\">Washington<\/option><option value=\"West Virginia\">West Virginia<\/option><option value=\"Wisconsin\">Wisconsin<\/option><option value=\"Wyoming\">Wyoming<\/option>"}];//NO I18N
        window.NewsLetterSubscriptionMode = JSON.parse('{"DOUBLE_OPT_IN":3,"SHOW_FIELD_WITHOUT_CHECKED":2,"HIDE_FIELD_WITH_CHECKED":0,"SHOW_FIELD_WITH_CHECKED":1}');//NO I18N
	$.validator.addMethod("userNameValidate", function(value, element){ //No I18N
		return Validator.isUserName(value);
	});
	$.validator.addMethod("nameValidate", function(value, element){ //No I18N
		return Validator.isName(value);
	});
	$.validator.addMethod("nameLength", function(value, element){ //No I18N
		return value.length<40;
	});
	$.validator.addMethod("phoneValidate", function(value, element){ //No I18N
		return isPhoneNumber(value);
	});
	$.validator.addMethod("dateValidate", function(value, element){ //No I18N
		return  /^\d{4}[.\/\-](0[1-9]|1[012])[.\/\-](0[1-9]|[12][0-9]|3[01])$/.test(value) && new Date() > new Date(value);
	});
	$.validator.addMethod("postalCodeValidate", function(value, element){ //No I18N
		return isPostalCode(value) && value.length < 20;
	});
        $(document.forms.signupform).zaSignUp({
            validator : {
                rules : {
                    firstname : {
                        required : true,
			userNameValidate : true,
			nameLength : true	
                    },
                    lastname : {
                        required : true,
			nameValidate : true,
			nameLength : true	
                    },
                    "c_dateofbirth" : {  //NO I18N
                       required : true,
		       dateValidate : true
                    },
                    "r_address/2.phone" : {   //NO I18N
                        required : true,
			phoneValidate : true
                    },
                    "r_address/2.company_name" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.job_title" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.street_address" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.city" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.state" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.country" : {  //NO I18N
                        required : true
                    },
                    "r_address/2.postal_code" : {  //NO I18N
                        required : true,
			postalCodeValidate : true
                    }


                },
                messages : {
                    firstname : {
                        required : document.forms.signupform.firstname && document.forms.signupform.firstname.nextSibling.innerText,
			userNameValidate : I18N.get("IAM.NEW.SIGNUP.FIRSTNAME.VERIFY.SPL.CHARACTER"),
			nameLength : I18N.get("IAM.NEW.SIGNUP.FIRSTNAME.VALID")
                    },
                    lastname : {
                        required : document.forms.signupform.lastname && document.forms.signupform.lastname.nextSibling.innerText,
			nameValidate : I18N.get("IAM.NEW.SIGNUP.LASTNAME.VERIFY.SPL.CHARACTER"),
			nameLength : I18N.get("IAM.NEW.SIGNUP.LASTNAME.VALID")
                    },
                    c_dateofbirth : {
                        required : document.forms.signupform.c_dateofbirth && document.forms.signupform.c_dateofbirth.nextSibling.innerText,
			dateValidate : I18N.get("IAM.ERROR.VALID.VALUE")
                    },
                    "r_address/2.phone" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.phone"] && document.forms.signupform["r_address/2.phone"].nextSibling.innerText,  //NO I18N
			phoneValidate : I18N.get("IAM.PHONE.ENTER.VALID.MOBILE_NUMBER")
                    },
                    "r_address/2.company_name" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.company_name"] && document.forms.signupform["r_address/2.company_name"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.job_title" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.job_title"] && document.forms.signupform["r_address/2.job_title"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.street_address" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.street_address"] && document.forms.signupform["r_address/2.street_address"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.city" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.city"] && document.forms.signupform["r_address/2.city"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.state" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.state"] && document.forms.signupform["r_address/2.state"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.country" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.country"] && document.forms.signupform["r_address/2.country"].nextSibling.innerText  //NO I18N
                    },
                    "r_address/2.postal_code" : {  //NO I18N
                        required : document.forms.signupform["r_address/2.postal_code"] && document.forms.signupform["r_address/2.postal_code"].nextSibling.innerText,  //NO I18N
			postalCodeValidate : I18N.get("IAM.ERROR.VALID.VALUE")
                    }
                }
            },
            // handleConfirmation : function(d){
            //     var callbackfn = function(){
            //         var params = {};
            //         if (document.forms.signupform.email.value) {
            //             params.user_identifier = document.forms.signupform.email.value;
            //         } else if (document.forms.signupform.mobile.value) {
            //             params.user_identifier = document.forms.signupform.mobile.value;
            //         } else if (document.forms.signupform.emailormobile.value) {
            //             params.user_identifier = document.forms.signupform.emailormobile.value;
            //         }
            //         var requestObj = {};
            //         requestObj.uri = "/portaluser/createUser";//No I18N
            //         requestObj.method = "POST";//No I18N
            //         requestObj.params = params;
            //         requestObj.headers = getCSRFHeader();
            //         requestObj.handler = function(){
            //             d.doAction();
            //         }
            //         postListener(requestObj);
            //     }
            //     var requestObj = {};
            //     requestObj.uri = "/portaluser/getCurrentPortalUser";//No I18N
            //     requestObj.method = "GET";//No I18N
            //     requestObj.handler = callbackfn;
            //     postListener(requestObj);
            // },

            oncomplete:function(d){
                if (d == $.fn.zaSignUp.SIGNUP_STATE.OTP_INITIATED) {
                    document.getElementById("otpfield").focus();
                }
            },
            handleSignuptracking:function(data){
                if(document.forms.signupform.newsletter && document.forms.signupform.newsletter.checked){
                    pushEventToPixel(PIXEL_REGISTRATION_EVENT);
                }
            }
        });
        let emailOrMobileContainer = document.querySelector('.za-emailormobile-container'); //No I18N
        if (emailOrMobileContainer) {
            emailOrMobileContainer.querySelector('[name="emailormobile"]').addEventListener("keyup", showCCMobilecontainer); //No I18N
        }
        let mobileContainer = document.querySelector(".za-mobile-container"); //No I18N
        if (mobileContainer) {
          let mobileInput = mobileContainer.querySelector('[name="mobile"]'); //No I18N
          mobileInput.style = "width: calc(100% - 40px);";
        }
    }

    function showCCMobilecontainer() {
        let emailOrMobileContainer = document.querySelector('.za-emailormobile-container'); //No I18N
        if (emailOrMobileContainer) {
            let inputContainer = emailOrMobileContainer.querySelector('[name="emailormobile"]'); //No I18N
            let ccMobileContainer = emailOrMobileContainer.querySelector(".ccmobile"); //No I18N
            let inputText = emailOrMobileContainer.querySelector('[name="emailormobile"]').value; //No I18N
            if (Number(inputText)) {
                ccMobileContainer.style = "";
                inputContainer.style = "width: calc(100% - 40px);";
            } else {
                ccMobileContainer.style = "display: none;";
                inputContainer.style = "";
            }
        }
    }

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    function getUrlParam(parameter, defaultvalue){
        var urlparameter = defaultvalue;
        if(window.location.href.indexOf(parameter) > -1){
            urlparameter = getUrlVars()[parameter];
            }
        return urlparameter;
    }

    window.onload = function(){
        if (document.querySelector(".signin-iframe")){
            let iframeEl = document.querySelector(".signin-iframe")  //no i18n 
            let iframeBody = iframeEl.contentDocument.body;
            iframeBody.style.overflow ="hidden";
            const moConfig = { attributes: true, childList: true, subtree: true };
            iframeEl.style.height = iframeBody.offsetHeight + 'px';
            var iframeMO = new MutationObserver(entries => {
                iframeEl.style.height = "";
                iframeEl.style.height = iframeBody.offsetHeight + 'px';
            });
            iframeMO.observe(iframeBody,moConfig);
        } else { 
            var params = getQueryString();
            var hiddenFields={};
            if(params.token){
                if(params.email){
                    var emailField = document.forms.portalSignUpForm.email;
                    emailField.readOnly = true;
                    emailField.value = decodeURIComponent(params.email);
                }

                if(params.token){
                    document.getElementById("signupContinueDiv").style.display="none";
                    document.getElementById("signupDiv").style.display="block";
                    document.getElementById("zs_verification").style.display="none";
                    document.getElementById("zs_signup_msg").style.display="none";
                    hiddenFields.token = params.token;
                }
            }
            var errorElem = document.getElementById("signup_error_msg_container");
            var parentElem = errorElem.parentNode;
            for(var hiddenField in hiddenFields){

                var hiddenTag = document.createElement("input");
                hiddenTag.type = "hidden";
                hiddenTag.value = hiddenFields[hiddenField];
                hiddenTag.name = hiddenField;
                parentElem.insertBefore(hiddenTag, errorElem);
            }
            /*if(document.forms.portalSignUpForm.email.getAttribute("disabled") != null){
                document.forms.portalSignUpForm.email.removeAttribute("disabled");
            }
            document.forms.portalSignUpForm.email.focus();*/
            var uri = getUrlParam("uri",""); //NO I18N
            document.getElementById("signinElm").href = (uri != "") ? "/signin?uri="+uri : "/signin";
        }
    }

    function getQueryString (){
        var queryStr = window.location.search.substring(1);
        var patt = /([^&=]+)={1}([^&]+)/g;
        var parameter;
        var params = {};
        while(parameter = patt.exec(queryStr)){
            params[parameter[1]] = parameter[2];
        }
        return params;
    }

    function submitForm(){
        var signupForm = document.forms.portalSignUpForm;
        cancelDatepicker();
        var signupFields = signupForm.elements;
        var sendRequest = true;
        //Get form fields
        var signupObj = {};
        var parameters = getQueryString();
        for(var i =0;i < signupFields.length;i++){
            var signupTag = signupFields[i];
            var signupName = signupTag.name;
            var signupType = signupTag.type;
            if(signupType == "text" || signupType == "textarea" || signupType == "password" || signupType == "hidden"){
                if(parameters.token){
                    if(signupName != "otp"){
                        var fieldVal = (signupName == "captcha") || signupName == "password" ?signupTag.value : trim(signupTag.value);//NO I18N
                        if(fieldVal != ""){
                            signupObj[signupName] = fieldVal;
                            hideFieldErrorMessage(signupTag);
                        } else{
                            if(signupName != "captcha" || document.getElementById("captcha_elm").style.display != "none") {
                                sendRequest = false;
                                showFieldErrorMessage(signupTag, i18n.get('portal.signup.'+signupName+'.message'));
                            }
                        }
                    }
                }else{
                    var fieldVal = (signupName == "captcha") || signupName == "password"?signupTag.value : trim(signupTag.value);//NO I18N
                    if(fieldVal != ""){
                        signupObj[signupName] = fieldVal;
                        hideFieldErrorMessage(signupTag);
                    } else{
                        if(signupName != "captcha" || document.getElementById("captcha_elm").style.display != "none") {
                            sendRequest = false;
                            showFieldErrorMessage(signupTag, i18n.get('portal.signup.'+signupName+'.message'));
                        }
                    }
                }
            } else if(signupType == "select-one"){
                var selectOpt = signupTag.options;
                if(selectOpt.length){
                    var selectedIndex = selectOpt.selectedIndex;
                    signupObj[signupName] = selectOpt[selectedIndex].value;
                }
            } else if(signupType == "checkbox"){
                var checkBoxLength = signupTag.length;
                if(signupTag.checked == true){
                    signupObj[signupName] = signupTag.value;
                } else {
                    signupObj[signupName] = 0;
                }
            } else if(signupType == "radio"){
                if(signupTag.checked == true){
                    signupObj[signupName] = signupTag.value;
                }
            }
        }
        var errorMsg="";
        var errorContainer = document.getElementById("signup_error_msg_container");
        errorContainer.style.display = "none";
        var email_patt = new RegExp("^[a-zA-Z0-9]([\\w\\-\\.\\+\']*)@([\\w\\-\\.]*)(\\.[a-zA-Z]{2,8}(\\.[a-zA-Z]{2}){0,2})$","mig");
        var password_patt = new RegExp("^[A-Za-z0-9#?!@$%^&*-]{8,250}$");
        if(sendRequest){
            if(signupObj.first_name && signupObj.first_name.length > 40) {
                showFieldErrorMessage(signupForm.first_name, i18n.get('portal.signup.first_name.errormsg'));
                signupForm.first_name.focus();
                sendRequest = false;
            } else if(signupObj.last_name && signupObj.last_name.length > 80) {
                showFieldErrorMessage(signupForm.last_name, i18n.get('portal.signup.last_name.errormsg'));
                signupForm.last_name.focus();
                sendRequest=false;
            } else if(signupObj.otp && (!isNumber(signupObj.otp) || signupObj.otp.length > 8)){
                showFieldErrorMessage(signupForm.otp, i18n.get('portal.signup.otp.message'));
                signupForm.otp.focus();
                sendRequest = false;
            } else if(signupObj.password.length < 8){
                showFieldErrorMessage(signupForm.password, i18n.get('portal.signup.password.minlen'));
                signupForm.password.focus();
                sendRequest = false;
            } else if(signupObj.password.length > 250){
                showFieldErrorMessage(signupForm.password, i18n.get('portal.signup.password.maxlen'));
                signupForm.password.focus();
                sendRequest = false;
            } else if((signupObj.first_name && (signupObj.first_name.length > 2 && signupObj.password.indexOf(signupObj.first_name) != -1)) || (signupObj.last_name && (signupObj.last_name.length > 2 && signupObj.password.indexOf(signupObj.last_name) != -1))){
                showFieldErrorMessage(signupForm.password, i18n.get('portal.signup.password.sameName.errormsg'));
                signupForm.password.focus();
                sendRequest = false;
            } else if(signupObj.password.indexOf(signupObj.email) != -1){
                showFieldErrorMessage(signupForm.password, i18n.get('portal.signup.password.sameMail.errormsg'));
                signupForm.password.focus();
                sendRequest = false;
            } else if(signupObj.password.indexOf(" ") != -1 || !password_patt.test(signupObj.password)){
                showFieldErrorMessage(signupForm.password, i18n.get('portal.signup.password.invalidFormat'));
                signupForm.password.focus();
                sendRequest = false;
            } else if(signupObj.confirm_password && signupObj.confirm_password != signupObj.password){
                showFieldErrorMessage(signupForm.confirm_password, i18n.get('portal.signup.confirm_password.mismatch'));
                signupForm.confirm_password.focus();
                sendRequest = false;
            } else if(signupObj.date_of_birth && !/^\d{4}[.\/\-](0[1-9]|1[012])[.\/\-](0[1-9]|[12][0-9]|3[01])$/.test(signupObj.date_of_birth)){
                showFieldErrorMessage(signupForm.date_of_birth, i18n.get('product.custom_field.date.invalid'));
                signupForm.date_of_birth.focus();
                sendRequest = false;
            } else if(signupObj.date_of_birth && new Date() < new Date(signupObj.date_of_birth)){
                showFieldErrorMessage(signupForm.date_of_birth, i18n.get('portal.signup.dateofbirth.invalid'));
                signupForm.date_of_birth.focus();
                sendRequest = false;
            } else if(signupObj.phone && !isPhoneNumber(signupObj.phone)){
                showFieldErrorMessage(signupForm.phone, i18n.get('portal.signup.phone.invalidFormat'));
                signupForm.phone.focus();
                sendRequest = false;
            } else if(signupObj.company_name && signupObj.company_name.length > 100){
                showFieldErrorMessage(signupForm.company_name, i18n.get('portal.signup.companyname.toolong'));
                signupForm.company_name.focus();
                sendRequest = false;
            } else if(signupObj.job_title && signupObj.job_title.length > 100){
                showFieldErrorMessage(signupForm.job_title, i18n.get('portal.signup.jobtitle.toolong'));
                signupForm.job_title.focus();
                sendRequest = false;
            } else if(signupObj.postal_code && (!isPostalCode(signupObj.postal_code) || signupObj.postal_code.length > 20)){
                showFieldErrorMessage(signupForm.postal_code, i18n.get('portal.signup.postal_code.invalidFormat'));
                signupForm.postal_code.focus();
                sendRequest = false;
            } else if(!email_patt.test(signupObj.email)){
                showFieldErrorMessage(signupForm.email, i18n.get('portal.signup.entervalidemail'));
                signupForm.email.focus();
                sendRequest = false;
            } else if(signupObj.email.length > 100){
                showFieldErrorMessage(signupForm.email, i18n.get('commentbox.formvalidate.emailtoolong'));
                signupForm.email.focus();
                sendRequest = false;
            }
            /*else if(signupObj.name && !containsLetters(signupObj.name)){
                errorMsg = "* Invalid format entered for name."; //NO I18N
                signupForm.name.focus();
            } else if(signupObj.state && !containsLetters(signupObj.state)){
                errorMsg = "* Invalid format entered for state."; //NO I18N
                signupForm.state.focus();
            } else if(signupObj.country && !containsLetters(signupObj.country)){
                errorMsg = "* Invalid format entered for country."; //NO I18N
                signupForm.country.focus();
            } else if(signupObj.address && !containsLetters(signupObj.address)){
                errorMsg = "* Invalid format entered for address."; //NO I18N
                signupForm.address.focus();
            } else if(signupObj.city && !containsLetters(signupObj.city)){
                errorMsg = "* Invalid format entered for city."; //NO I18N
                signupForm.city.focus();
            }*/
            if(errorMsg){
                sendRequest = false;
            }
        }

        if(!sendRequest){
            return;
        }
        signupObj.email = signupObj.email.toLowerCase();

        var uri = getUrlParam("uri",""); //NO I18N
        if(uri != "") {
            signupObj.uri = uri;
        }

        if(captcha_exception){
            signupObj[signupObj.digest] = signupObj.captcha;
            delete signupObj.captcha;
            delete signupObj.digest;
            captcha_exception = false;
        }
        showLoader();
        var requestObj = {};
        requestObj.uri = "/portaluser/createUser";//No I18N
        requestObj.method = "POST";//No I18N
        requestObj.params = signupObj;
        requestObj.handler = "portal_signup.signupResponse";//NO I18N
        requestObj.headers = getCSRFHeader();
        postListener(requestObj);
    }

    function signupPreConfirmation(){
        var errorCont = document.getElementById("signup_user_error_msg_container");
        errorCont.style.display = "none";
        var requestObj = {};
        requestObj.handler = "portal_signup.signupPreConfRes";//NO I18N
        var params = {};
        params.resend = "false";//NO I18N
        sendEmailConfirmation(requestObj, params);
    }

    function signupPreConfRes (response){
        if(response.status_code == 0){
            document.getElementById("signupContinueDiv").style.display = "none"; //NO I18N
            document.getElementById("signupDiv").style.display = "block"; //NO I18N
            document.getElementById("changeSignupEmail").style.display = "block"; //NO I18N
            document.getElementById("zs_signup_msg").style.display = "block"; //NO I18N
            var email = document.forms.portalSignUpForm.email.value.trim();
            document.forms.portalSignUpForm.reset();
            document.forms.portalSignUpForm.email.value = email;
            document.forms.portalSignUpForm.email.style.paddingRight = "78px";// NO I18N
            document.forms.portalSignUpForm.email.className = "field-disable"; //NO I18N
            document.forms.portalSignUpForm.email.setAttribute("disabled", "true"); //NO I18N
            document.forms.portalSignUpForm.otp.focus();
            var elems = document.getElementsByClassName("field-error-msg"); //NO I18N
            for(var i=0;i<elems.length;i++){
                elems[i].style.display="none";
            }
            bindDateElement();
        } else{
            var errorCont = document.getElementById("signup_user_error_msg_container");
            errorCont.style.display = "block";
            var error_msg = response.error.message;
            if(error_msg == "Email already exists"){
                error_msg = i18n.get('portal.signup.email.exists');
            }
            errorCont.innerHTML = error_msg;
        }
    }

    function bindDateElement() {
        var dateInputs = document.querySelectorAll('[data-zs-app="datepicker_app"]'); //NO I18N

        if(dateInputs.length > 0 && typeof datepickerJS == "undefined") {
            var div = document.createElement("div"); // No I18N
            div.setAttribute("data-zs-app", "datepicker_app"); // No I18N
            zsApp.init(div);
        }

        dateInputs.forEach(function(dateInput) {
            dateInput.addEventListener("click", function(event) {
            //$E.bind(dateInput, "click", function(event) {
                var iconElement = document.querySelector('[data-element-id="date"]', event.currentTarget.parentNode);//NO I18N
                initiateDatePicker(iconElement, event.currentTarget.parentNode, event.currentTarget)
            });
        })

        var dateIconElements = document.querySelectorAll("[data-element-id=date]"); //NO I18N
        dateIconElements.forEach( function(dateElement) {
            dateElement.addEventListener("click", function(event) {
            //$E.bind(dateElement, "click", function(event) {
                initiateDatePicker(event.currentTarget, event.currentTarget.parentNode);
            });
        });
    }

    function initiateDatePicker(icon, context, dateInput) {
        if(!dateInput) {
            dateInput = document.querySelector('[data-field-type="date"]', context);//NO I18N
        }

        datepickerJS && datepickerJS.init(icon,'date', context); //NO I18N
    }

    function cancelDatepicker(){
        var node;
        node = document.getElementById("datepicker");
        node && node.parentNode.removeChild(node);
    }

    function fnChangeSignupEmail(){
        var errorCont = document.getElementById("signup_user_error_msg_container");
        errorCont.style.display = "none";
        document.getElementById("changeSignupEmail").style.display = "none";
        document.forms.portalSignUpForm.email.className = "";
        document.forms.portalSignUpForm.email.removeAttribute("disabled");
        document.forms.portalSignUpForm.email.style.paddingRight = "0px"; //NO I18N
        document.forms.portalSignUpForm.email.focus();
        document.forms.portalSignUpForm.otp.value="";
        document.getElementById("signupContinueDiv").style.display = "block";
        document.getElementById("signupDiv").style.display = "none";
        document.getElementById("zs_signup_msg").style.display = "none";
    }

    function resendEmailConfirmation(){
        var requestObj = {};
        requestObj.handler = "portal_signup.resendEmailConfirmationRes";//NO I18N
        var params = {};
        params.resend = "true";//NO I18N
        sendEmailConfirmation(requestObj, params);
    }

    function resendEmailConfirmationRes(response){
        var verElem = document.getElementById("zs_verification");
        var errorElem = verElem.getElementsByClassName("field-error-msg")[0];
        if(response.status_code == 0){
            errorElem.innerHTML = i18n.get('portal.signup.verification.resend');
        } else{
            errorElem.innerHTML = response.msg;
        }
        errorElem.style.display = "block";//NO I18N
    }

    function sendEmailConfirmation(requestObj, params){
        var signupForm = document.forms.portalSignUpForm;
        var email_patt = new RegExp("^[a-zA-Z0-9]([\\w\\-\\.\\+\']*)@([\\w\\-\\.]*)(\\.[a-zA-Z]{2,8}(\\.[a-zA-Z]{2}){0,2})$","mig");
        if(!email_patt.test(signupForm.email.value.trim())){
            document.getElementById("signup_user_error_msg_container").innerHTML = i18n.get('portal.signup.entervalidemail');
            document.getElementById("signup_user_error_msg_container").style.display = "block";//No I18N
            return;
        } else if( signupForm.email.value.length > 100){
            document.getElementById("signup_user_error_msg_container").innerHTML = i18n.get('commentbox.formvalidate.emailtoolong');
            document.getElementById("signup_user_error_msg_container").style.display = "block";//No I18N
            return;
        }
        params.email = signupForm.email.value.trim().toLowerCase();

        requestObj.params = params;
        requestObj.uri = "/portaluser/checkSignupUserEmail";//No I18N
        requestObj.method = "POST";//No I18N
        requestObj.headers = getCSRFHeader();
        postListener(requestObj);
    }

    function showFieldErrorMessage(elem, message){
        if(elem.type == "hidden"){
            return;
        }
        var parentElem = elem.parentNode;
        var errorElem = parentElem.querySelector("[class=field-error-msg]");//No I18N
        if(message){
            errorElem.innerHTML = message;
        }
        errorElem.style.display = "block";
    }

    function hideFieldErrorMessage(elem){
        if(elem.type == "hidden"){
            return;
        }
        var parentElem = elem.parentNode;
        var errorElem = parentElem.querySelector("[class=field-error-msg]");//No I18N
        if(errorElem != null){
            errorElem.style.display = "none";
        }
    }

    function trim(str) {
        str = str.replace(/^\s*(.*)/, "$1");
        str = str.replace(/(.*?)\s*$/, "$1");
        return str;
    }

    function isNumber(text){
        var numberPatt = /^\d+$/;
        return numberPatt.test(text);
    }

   function isPhoneNumber(text){
        var phNumberPatt = /^(\+|0)?((-|\.|\s)?(\()?[0-9](\))?){0,16}$/;
        return phNumberPatt.test(text);
    }

    function isPostalCode(text){
        var postal_code = /^[a-zA-Z0-9 -]*$/;
        var regex = /^[ -]*$/;
            if(text.length > 0 && text.match(regex)){
                return false;
            }
        return postal_code.test(text);
    }

    function fnCloseNotification(){
        document.getElementById("zs_signup_msg").style.display="none";
    }

    function getCSRFHeader() {
        return {"X-ZCSRF-TOKEN":"csrfp="+getCookie('csrfc')} //No I18N
    }

    function getCookie(cname) {
        var rexPat = new RegExp(cname+"=[^;]*");
        var allCookie = document.cookie;
        var myCookie = rexPat.exec(allCookie);
        if(myCookie){
            var cookie=myCookie[0].split("=");
            return unescape(cookie[1]);
        }
        else{
            return null;
        }
    }

    function convertDatetoMillis(){
        document.forms.signupform["r_user.date_of_birth"].value = new Date(document.forms.signupform.c_dateofbirth.value).getTime();
        cancelDatepicker();
        return true;
    }
    function validateFields(el){
        var signupTag = el;
        var signupName = signupTag.name;
        var signupType = signupTag.type;
        if(signupType == "text" || signupType == "textarea" || signupType == "password" || signupType == "hidden"){
            var fieldVal = (signupName == "captcha") || signupName == "password"?signupTag.value : trim(signupTag.value);//NO I18N
            if(fieldVal != ""){
                hideFieldErrorMessage(signupTag);
                document.querySelector(".signup-button").removeAttribute("disabled");//NO I18N
            } else{
                if(signupName != "captcha" || document.getElementById("captcha_elm").style.display != "none") {
                    showFieldErrorMessage(signupTag);
                    document.querySelector(".signup-button").disabled = true; //No I18N
                }
            }

        } /*else if(signupType == "select-one"){
            var selectOpt = signupTag.options;
            if(selectOpt.length){
                var selectedIndex = selectOpt.selectedIndex;
                signupObj[signupName] = selectOpt[selectedIndex].value;
            }
        } else if(signupType == "checkbox"){
            var checkBoxLength = signupTag.length;
            if(signupTag.checked == true){
                signupObj[signupName] = signupTag.value;
            } else {
                signupObj[signupName] = 0;
            }
        } else if(signupType == "radio"){
            if(signupTag.checked == true){
                signupObj[signupName] = signupTag.value;
            }
        }*/
    }

    return {
        postListener : postListener,
        fnKeyDown : fnKeyDown,
        signupResponse : signupResponse,
        getQueryString : getQueryString,
        submitForm : submitForm,
        signupPreConfirmation : signupPreConfirmation,
        signupPreConfRes : signupPreConfRes,
        fnChangeSignupEmail : fnChangeSignupEmail,
        resendEmailConfirmation : resendEmailConfirmation,
        resendEmailConfirmationRes : resendEmailConfirmationRes,
        sendEmailConfirmation : sendEmailConfirmation,
        showFieldErrorMessage : showFieldErrorMessage,
        hideFieldErrorMessage : hideFieldErrorMessage,
        trim : trim,
        isNumber : isNumber,
        isPhoneNumber : isPhoneNumber,
        isPostalCode  : isPostalCode,
        fnCloseNotification : fnCloseNotification,
        convertDatetoMillis : convertDatetoMillis,
        validateFields : validateFields
    }
})();
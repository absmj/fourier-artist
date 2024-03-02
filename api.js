const apiList = [{
    name: 'noun',
    title: 'The Noun Project',
    info: `<div><svg width="200" title="Noun Project Logo" viewBox="0 0 264 26" sizes="" class="img-fluid"><defs><path id="s-7b04bdce5b-a" d="M221.01 5.629v15.326c0 .776-.061 1.376-.237 1.976-.181.537-.42 1.018-.838 1.375-.357.357-.9.657-1.557.838-.657.181-1.495.238-2.514.238-.48 0-.9-.062-1.257-.119v-3.295c.181.063.481.063.838.063.42 0 .776-.063 1.076-.238.3-.176.481-.538.481-1.076V5.629h4.009zm25.444-.3c.838 0 1.676.119 2.514.357.775.238 1.494.6 2.156 1.019a5.464 5.464 0 011.557 1.738c.42.719.6 1.494.657 2.456h-3.77c-.3-1.794-1.257-2.632-2.995-2.632-.657 0-1.195.119-1.614.419-.419.3-.776.657-1.076 1.138-.3.48-.481.957-.6 1.557a8.03 8.03 0 00-.181 1.675c0 .538.062 1.076.181 1.614s.3 1.02.538 1.495c.238.419.6.776 1.019 1.076.419.3.957.419 1.557.419.957 0 1.676-.238 2.214-.776s.838-1.257.957-2.157h3.89c-.239 1.914-1.02 3.414-2.277 4.428-1.257 1.013-2.813 1.557-4.79 1.557-1.075 0-2.094-.181-2.994-.538a6.89 6.89 0 01-2.333-1.557c-.657-.657-1.138-1.438-1.495-2.333-.357-.9-.538-1.914-.538-2.995 0-1.138.181-2.157.481-3.17a8.55 8.55 0 011.438-2.514c.657-.72 1.438-1.257 2.333-1.676.9-.42 1.976-.6 3.17-.6zm-109.128.3v8.26c0 1.195.181 2.095.538 2.695.357.6 1.02.9 2.033.9 1.076 0 1.914-.3 2.395-.957.48-.657.719-1.738.719-3.233V5.63h4.008v14.607h-3.827v-2.033h-.062c-.538.838-1.195 1.438-1.976 1.857-.838.357-1.614.538-2.514.538-1.076 0-1.976-.12-2.633-.42-.719-.3-1.257-.656-1.614-1.194-.419-.538-.656-1.138-.838-1.914-.18-.719-.237-1.557-.237-2.457V5.63h4.008zm93.202-.42c1.257 0 2.333.239 3.233.72a7.117 7.117 0 012.276 1.914c.6.838 1.018 1.738 1.318 2.751.238 1.02.357 2.095.3 3.233H227.12c0 1.381.357 2.338.957 2.876.6.6 1.495.9 2.576.9.838 0 1.495-.181 2.095-.6.6-.419.957-.838 1.076-1.319h3.532c-.537 1.738-1.437 2.995-2.575 3.77-1.195.777-2.576 1.139-4.252 1.139-1.138 0-2.214-.181-3.114-.538-.9-.357-1.738-.9-2.333-1.557-.657-.657-1.138-1.495-1.494-2.457-.357-.957-.538-1.976-.538-3.114a8.67 8.67 0 01.538-3.052c.356-.957.837-1.738 1.556-2.451.657-.657 1.438-1.257 2.333-1.614.9-.42 1.914-.6 3.052-.6zm-22.924 0c1.138 0 2.214.182 3.114.539.956.357 1.737.9 2.394 1.557a6.911 6.911 0 011.557 2.457c.357.956.538 2.032.538 3.17 0 1.195-.18 2.214-.538 3.17-.357.958-.838 1.739-1.557 2.396a6.695 6.695 0 01-2.394 1.557c-.957.357-1.976.538-3.114.538s-2.214-.181-3.114-.538c-.9-.357-1.738-.9-2.395-1.557a7.233 7.233 0 01-1.557-2.395c-.357-.957-.538-1.976-.538-3.17 0-1.196.181-2.215.538-3.171.357-.957.838-1.738 1.557-2.457a6.695 6.695 0 012.395-1.557c.9-.357 1.976-.538 3.114-.538zm-83.747 0c1.138 0 2.214.182 3.114.539.957.357 1.738.9 2.395 1.557a6.911 6.911 0 011.557 2.457c.357.956.538 2.032.538 3.17 0 1.195-.181 2.214-.538 3.17-.357.958-.838 1.739-1.557 2.396a6.695 6.695 0 01-2.395 1.557c-.957.357-1.976.538-3.114.538s-2.214-.181-3.114-.538c-.9-.357-1.738-.9-2.394-1.557a7.233 7.233 0 01-1.557-2.395c-.357-.957-.538-1.976-.538-3.17 0-1.196.18-2.215.538-3.171.357-.957.838-1.738 1.557-2.457a6.695 6.695 0 012.394-1.557c.9-.357 1.976-.538 3.114-.538zm136.904-4.008v4.37h2.932v2.753h-2.932v7.241c0 .657.119 1.138.357 1.376.237.238.656.357 1.375.357h.657c.181 0 .42-.062.6-.062v3.113a6.404 6.404 0 01-1.138.12h-1.194c-.6 0-1.195-.063-1.795-.12-.538-.062-1.02-.237-1.495-.48a2.79 2.79 0 01-1.02-1.02c-.237-.48-.356-1.018-.356-1.794V8.267h-2.457V5.572h2.457v-4.37h4.009zM44.3.001l3.708 3.714-6.46 6.403 6.46 6.41-3.709 3.708-6.465-6.466-6.528 6.466-3.646-3.709 6.46-6.409-6.46-6.403L31.307.001l6.528 6.466L44.3 0zM1.802 4.355C4.985-.237 11.288-1.38 15.88 1.803c4.592 3.182 5.735 9.485 2.552 14.078-3.182 4.592-9.485 5.735-14.078 2.552C-.237 15.251-1.38 8.948 1.803 4.355zM76.747.001v20.235H56.512V0h20.235zm122.477 5.152c.238 0 .538.062.9.119v3.833c-.18-.062-.419-.062-.656-.12-.238 0-.538-.061-.776-.061-.72 0-1.376.119-1.857.357-.538.237-.9.6-1.257 1.018-.3.42-.538.9-.657 1.495a8.901 8.901 0 00-.181 1.857v6.585h-4.009V5.629h3.766v2.695h.062c.181-.481.419-.9.776-1.257.3-.357.719-.72 1.076-1.02.419-.3.838-.48 1.319-.656.48-.181.957-.238 1.494-.238zM101.29 0l8.441 13.531h.057V.002h4.133v20.177h-4.433l-8.38-13.47h-.061v13.527h-4.128V0h4.371zm56.57 5.204c1.077 0 1.977.119 2.633.419.657.3 1.257.719 1.614 1.194.42.538.657 1.138.838 1.914.181.72.238 1.557.238 2.457v8.98h-4.009v-8.194c0-1.194-.18-2.094-.537-2.694-.357-.6-1.02-.9-2.033-.9-1.076 0-1.914.3-2.395.956-.481.657-.719 1.738-.719 3.233v7.66h-4.009V5.63h3.828v2.033h.062c.538-.838 1.195-1.438 1.976-1.857.838-.357 1.614-.6 2.514-.6zM182.043 0c1.257 0 2.332.181 3.232.538.9.357 1.614.838 2.157 1.438a5.57 5.57 0 011.195 2.095c.238.776.357 1.557.357 2.395 0 .838-.119 1.614-.357 2.395a5.64 5.64 0 01-1.195 2.094c-.538.6-1.257 1.076-2.157 1.438-.9.362-1.975.538-3.232.538h-4.671v7.242h-4.428V0h9.099zm-58.247 8.204c-.719 0-1.257.119-1.676.419-.48.3-.838.6-1.076 1.075-.3.42-.48.957-.6 1.495a8.178 8.178 0 00-.18 1.738c.005.6.061 1.138.18 1.738.12.538.3 1.076.6 1.495.3.419.657.776 1.076 1.076.481.238 1.02.419 1.676.419.657 0 1.257-.12 1.738-.42.481-.237.838-.6 1.076-1.075.3-.419.481-.957.6-1.495a8.177 8.177 0 00.181-1.738c0-.6-.062-1.138-.181-1.738-.119-.538-.3-1.076-.6-1.495a4.618 4.618 0 00-1.076-1.075c-.481-.3-1.019-.42-1.738-.42zm83.747 0c-.657 0-1.257.119-1.676.419-.481.3-.838.6-1.076 1.075-.3.42-.481.957-.6 1.495a8.177 8.177 0 00-.181 1.738c.005.6.062 1.138.181 1.738.119.538.3 1.076.6 1.495.3.419.657.776 1.076 1.076.48.238 1.019.419 1.676.419s1.257-.12 1.738-.42c.48-.237.838-.6 1.075-1.075.3-.419.482-.957.6-1.495a8.177 8.177 0 00.182-1.738c0-.6-.063-1.138-.182-1.738-.118-.538-.3-1.076-.6-1.495a4.618 4.618 0 00-1.075-1.075c-.481-.3-1.02-.42-1.738-.42zm22.872.062c-.657 0-1.195.119-1.614.3-.419.238-.776.48-1.019.776-.238.3-.419.656-.538 1.019-.119.356-.18.656-.18.956h6.522c-.181-.956-.481-1.737-.957-2.275-.481-.538-1.195-.776-2.214-.776zm-49.567-4.733h-3.47v6.047h3.47v-.057c.538 0 1.019-.062 1.495-.12.48-.061.9-.237 1.257-.418.356-.238.656-.538.838-.9.237-.42.3-.9.3-1.557 0-.657-.12-1.138-.3-1.557-.238-.42-.482-.72-.838-.9-.357-.238-.776-.357-1.257-.42a11.296 11.296 0 00-1.495-.118zM221.01.064v3.294h-4.009V.063h4.009z"></path></defs><use fill="#000" fill-rule="nonzero" xlink:href="#s-7b04bdce5b-a"></use></svg><p class='mt-1 text-muted'>Noun Project is building a global visual language that unites us — a language that allows quick and easy communication no matter who you are or where you are.</p></div>`,
    query: 'happy',
    samples: [],
    selected: null,
    loading: false,
    search: "searchFromNounApi",
    get: "selectFromNounApi",
    onlySvg: true,
    supportPng: false,

    get buildQuery() {
        return this.query
    }
},

{
    name: 'commons',
    title: 'Wikimedia Commons',
    info: `<div>
        <img class="img-fluid" src="https://commons.wikimedia.org/static/images/project-logos/commonswiki-2x.png" style="width:5em" />
       <p class='mt-1 text-muted'>Wikimedia Commons is part of the non-profit, multilingual, free-content Wikimedia family.</p></div>`,
    query: 'happy',
    samples: [],
    selected: null,
    loading: false,
    search: "searchFromCommonsApi",
    get: "selectFromCommonsApi",
    onlySvg: true,
    supportPng: true,

    get buildQuery() {
        return this.query + (this.onlySvg ? '.svg' : '')
    }
}]
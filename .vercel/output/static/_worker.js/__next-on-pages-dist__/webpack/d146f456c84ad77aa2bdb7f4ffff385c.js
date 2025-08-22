var p={},F=($,y,A)=>(p.__chunk_855=()=>{},p.__chunk_3808=(j,D,O)=>{"use strict";let c,u,s,w,d;var E=Object.create,i=Object.defineProperty,q=Object.getOwnPropertyDescriptor,f=Object.getOwnPropertyNames,P=Object.getPrototypeOf,C=Object.prototype.hasOwnProperty,g=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of f(t))C.call(e,r)||r===n||i(e,r,{get:()=>t[r],enumerable:!(o=q(t,r))||o.enumerable});return e},R=(c={"../../node_modules/dedent-tabs/dist/dedent-tabs.js"(e){Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(t){for(var n=typeof t=="string"?[t]:t.raw,o="",r=0;r<n.length;r++)if(o+=n[r].replace(/\\\n[ \t]*/g,"").replace(/\\`/g,"`").replace(/\\\$/g,"$").replace(/\\\{/g,"{"),r<(1>=arguments.length?0:arguments.length-1)){var M=o.substring(o.lastIndexOf(`
`)+1).match(/^(\s*)\S?/);o+=((1>r+1||arguments.length<=r+1?void 0:arguments[r+1])+"").replace(/\n/g,`
`+M[1])}var b=o.split(`
`),a=null;if(b.forEach(function(l){var v=l.match(/^(\s+)\S+/);if(v){var x=v[1].length;a=a?(0,Math.min)(a,x):x}}),a!==null){var N=a;o=b.map(function(l){return l[0]===" "||l[0]==="	"?l.slice(N):l}).join(`
`)}return o.trim().replace(/\\n/g,`
`)}}},function(){return u||(0,c[f(c)[0]])((u={exports:{}}).exports,u),u.exports}),h={};((e,t)=>{for(var n in t)i(e,n,{get:t[n],enumerable:!0})})(h,{getOptionalRequestContext:()=>_,getRequestContext:()=>k}),j.exports=g(i({},"__esModule",{value:!0}),h),O(855);var m=(d=(s=R())!=null?E(P(s)):{},g(!w&&s&&s.__esModule?d:i(d,"default",{value:s,enumerable:!0}),s)),S=Symbol.for("__cloudflare-request-context__");function _(){let e=y[S];if((process?.release?.name==="node"?"nodejs":"edge")=="nodejs")throw Error(m.default`
			\`getRequestContext\` and \`getOptionalRequestContext\` can only be run
			inside the edge runtime, so please make sure to have included
			\`export const runtime = 'edge'\` in all the routes using such functions
			(regardless of whether they are used directly or indirectly through imports).
		`);return e}function k(){let e=_();if(!e)throw process?.env?.NEXT_PHASE==="phase-production-build"?Error(m.default`
				\n\`getRequestContext\` is being called at the top level of a route file, this is not supported
				for more details see https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-nextjs-site/#top-level-getrequestcontext \n
			`):Error("Failed to retrieve the Cloudflare request context.");return e}},p);export{F as __getNamedExports};

import {AbsoluteFill} from 'remotion';
import {Room,Hero,Duck,Claw,Line,P} from './art';
export const Cover=()=> <AbsoluteFill style={{background:P.dark,fontFamily:'Cairo',direction:'rtl'}}>
<svg width="1080" height="1920"><Room t={0}/><Line d="M779 360 Q984 735 477 1170" color={P.red} width={7}/><Claw x={780} y={914} closed={1}/><Hero x={391} y={1440} face="strain" lean={-8} left={[-41,-167]} right={[126,-183]}/><Duck x={531} y={1300} s={1.4}/><Duck x={750} y={1410} s={1.6}/></svg>
<div style={{position:'absolute',top:367,right:85,left:85,textAlign:'center',color:P.ink,fontSize:110,fontWeight:800,lineHeight:1.5}}>آلة الأمنية</div><div style={{position:'absolute',top:556,right:85,left:85,textAlign:'center',color:P.mint,fontSize:49}}>لماذا لا تدوم «أخيرًا»؟</div><div style={{position:'absolute',top:1505,right:85,left:85,textAlign:'center',color:P.ink,fontSize:37}}>فكرة من فلسفة شوبنهاور</div>
</AbsoluteFill>;

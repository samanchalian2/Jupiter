import { Component, createContext, useContext, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { redactText, sanitizeStack, routeTemplate, type BrowserSdk } from '@observability/browser-sdk';
const SdkContext=createContext<BrowserSdk|null>(null);
export function ObservabilityProvider({sdk,children}:{sdk:BrowserSdk;children:ReactNode}){
  useEffect(()=>sdk.start(),[sdk]);
  return <SdkContext.Provider value={sdk}>{children}</SdkContext.Provider>;
}
export function useObservability(){return useContext(SdkContext);}
export function useRouteContext(path:string){const sdk=useObservability();useEffect(()=>{if(sdk)void sdk.capture({category:'PERFORMANCE',severity:'INFO',eventCode:'ui.route_changed',normalizedMessage:'Navigation completed',routeTemplate:routeTemplate(path),safeMetadata:{outcome:'SUCCESS'}});},[sdk,path]);}
export interface BoundaryProps {sdk:BrowserSdk;children:ReactNode;fallback:ReactNode|((reset:()=>void)=>ReactNode);componentName?:string;}
export class ObservabilityErrorBoundary extends Component<BoundaryProps,{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error,_info:ErrorInfo){
    // React's component stack/props may expose user data; never record them.
    void this.props.sdk.capture({category:'FRONTEND',severity:'ERROR',eventCode:'react.render_failed',normalizedMessage:redactText(error.message).slice(0,2000),exceptionType:error.name,sanitizedStack:sanitizeStack(error.stack??''),safeMetadata:{component:(this.props.componentName??'Application').replace(/[^A-Za-z0-9_.-]/g,'').slice(0,80)}});
  }
  reset=()=>this.setState({failed:false});
  render(){return this.state.failed?(typeof this.props.fallback==='function'?this.props.fallback(this.reset):this.props.fallback):this.props.children;}
}

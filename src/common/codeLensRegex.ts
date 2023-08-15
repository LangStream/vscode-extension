export const applicationModuleManifest:RegExp[] = [
  new RegExp(/^.*?(\bname\b:).*?$/im),
  new RegExp(/^.*?(\btopics\b:).*?$/im),
  new RegExp(/^.*?(\bpipeline\b:).*?$/im),
];

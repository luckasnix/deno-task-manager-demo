export const getUrlPatternResult = (
  requestUrl: string,
): URLPatternResult | null => {
  return new URLPattern({ pathname: "/tasks/:id?" }).exec(requestUrl);
};

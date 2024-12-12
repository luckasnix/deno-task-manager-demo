export const getUrlPatternResult = (
  requestUrl: string,
): URLPatternResult | null => {
  return new URLPattern({ pathname: "/todos/:id?" }).exec(requestUrl);
};

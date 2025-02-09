export const benefitColors = [
  "#EFE9F5",
  "#D7F6E5",
  "#DBE9FE",
  "#F7F7D3",
  "#F7DEE4",
];

export const benefitBorderColors = [
  "#D3B5F3",
  "#8BD3AC",
  "#8FB8E8",
  "#F3EDB5",
  "#F3B5C8",
];

export const benefitColorBorderMap = new Map(
  benefitColors.map((color, index) => [color, benefitBorderColors[index]])
);

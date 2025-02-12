export const getSortQuery = (value, direction) => {
  const sortDirection = direction === "asc" ? 1 : -1; // Default to descending if invalid

  switch (value) {
    case "date":
      return { createdAt: sortDirection };
    case "name":
      return { name: sortDirection };
    default:
      return { createdAt: -1 }; // Default: newest first
  }
};

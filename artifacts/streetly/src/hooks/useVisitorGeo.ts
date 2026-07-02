import { useGetGeoInfo, getGetGeoInfoQueryKey } from "@workspace/api-client-react";

export function useVisitorGeo() {
  const { data, isLoading } = useGetGeoInfo({
    query: {
      queryKey: getGetGeoInfoQueryKey(),
      staleTime: 30 * 60 * 1000,
      retry: 1,
    },
  });

  return {
    geo: data ?? null,
    isLoading,
  };
}

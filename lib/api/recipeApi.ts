const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * 공통 fetch 옵션 (쿠키 기반 인증)
 */
function getFetchOptions(method: string = "GET", body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

/**
 * 백엔드 RsData 응답 처리
 */
interface RsData<T> {
  resultCode: string;
  msg: string;
  data: T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();

    // RsData 구조인 경우
    if (json.resultCode && json.data !== undefined) {
      return json.data as T;
    }

    // 직접 데이터인 경우
    return json as T;
  }

  // JSON이 아닌 경우
  return undefined as T;
}

/**
 * 레시피 타입 정의
 */
export enum RecipeCategory {
  KOREAN = "KOREAN",
  WESTERN = "WESTERN",
  JAPANESE = "JAPANESE",
  CHINESE = "CHINESE",
  DESSERT = "DESSERT",
}

export enum CookingTime {
  UNDER_10 = "UNDER_10",
  FROM_10_TO_20 = "FROM_10_TO_20",
  FROM_20_TO_30 = "FROM_20_TO_30",
  OVER_30 = "OVER_30",
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export interface RecipeResponse {
  id: number;
  title: string;
  description: string;
  category: RecipeCategory;
  cookingTime: CookingTime;
  difficulty: Difficulty;
  servings: number;
  ingredients: string[];
  steps: string[];
  status?: string;
}

export interface RecipeGenerateRequest {
  prompt: string;
  category?: RecipeCategory;
  cookingTime?: CookingTime;
  difficulty?: Difficulty;
  servings?: number;
  count?: number;
}

export interface RecipeSaveRequest {
  title: string;
  description: string;
  category: RecipeCategory;
  cookingTime: CookingTime;
  difficulty: Difficulty;
  servings: number;
  ingredients: string[];
  steps: string[];
}

/**
 * FE에서 사용하는 값과 BE Enum 값 매핑
 */
export function mapCategoryToEnum(category: string): RecipeCategory | undefined {
  const mapping: Record<string, RecipeCategory> = {
    한식: RecipeCategory.KOREAN,
    양식: RecipeCategory.WESTERN,
    일식: RecipeCategory.JAPANESE,
    중식: RecipeCategory.CHINESE,
    디저트: RecipeCategory.DESSERT,
  };
  return mapping[category];
}

export function mapCookingTimeToEnum(
  cookingTime: string
): CookingTime | undefined {
  const mapping: Record<string, CookingTime> = {
    "10분 이내": CookingTime.UNDER_10,
    "10-20분": CookingTime.FROM_10_TO_20,
    "20-30분": CookingTime.FROM_20_TO_30,
    "30분 이상": CookingTime.OVER_30,
  };
  return mapping[cookingTime];
}

export function mapDifficultyToEnum(difficulty: string): Difficulty | undefined {
  const mapping: Record<string, Difficulty> = {
    쉬움: Difficulty.EASY,
    보통: Difficulty.MEDIUM,
    어려움: Difficulty.HARD,
  };
  return mapping[difficulty];
}

export function mapServingsToNumber(servings: string): number {
  const mapping: Record<string, number> = {
    "1인분": 1,
    "2인분": 2,
    "3인분": 3,
  };
  return mapping[servings] || 1;
}

/**
 * Enum 값을 FE에서 사용하는 값으로 변환
 */
export function mapCategoryToDisplay(category: RecipeCategory): string {
  const mapping: Record<RecipeCategory, string> = {
    [RecipeCategory.KOREAN]: "한식",
    [RecipeCategory.WESTERN]: "양식",
    [RecipeCategory.JAPANESE]: "일식",
    [RecipeCategory.CHINESE]: "중식",
    [RecipeCategory.DESSERT]: "디저트",
  };
  return mapping[category] || category;
}

export function mapCookingTimeToDisplay(cookingTime: CookingTime): string {
  const mapping: Record<CookingTime, string> = {
    [CookingTime.UNDER_10]: "10분 이내",
    [CookingTime.FROM_10_TO_20]: "10-20분",
    [CookingTime.FROM_20_TO_30]: "20-30분",
    [CookingTime.OVER_30]: "30분 이상",
  };
  return mapping[cookingTime] || cookingTime;
}

export function mapDifficultyToDisplay(difficulty: Difficulty): string {
  const mapping: Record<Difficulty, string> = {
    [Difficulty.EASY]: "쉬움",
    [Difficulty.MEDIUM]: "보통",
    [Difficulty.HARD]: "어려움",
  };
  return mapping[difficulty] || difficulty;
}

export function mapServingsToDisplay(servings: number): string {
  return `${servings}인분`;
}

/**
 * AI 레시피 생성 (회원/비회원)
 */
export async function generateRecipes(
  request: RecipeGenerateRequest
): Promise<RecipeResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipes/generate`,
    getFetchOptions("POST", request)
  );

  return handleResponse<RecipeResponse[]>(response);
}

/**
 * 레시피 저장 (로그인 필수)
 */
export async function saveRecipe(
  request: RecipeSaveRequest
): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipes`,
    getFetchOptions("POST", request)
  );

  return handleResponse<number>(response);
}

/**
 * 생성된 레시피 목록 조회 (로그인 필수)
 */
export async function fetchGeneratedRecipes(): Promise<RecipeResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipes/generated`,
    getFetchOptions()
  );

  return handleResponse<RecipeResponse[]>(response);
}

/**
 * 저장된 레시피 목록 조회 (로그인 필수)
 */
export async function fetchSavedRecipes(): Promise<RecipeResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipes/saved`,
    getFetchOptions()
  );

  return handleResponse<RecipeResponse[]>(response);
}

/**
 * 레시피 삭제 (로그인 필수)
 */
export async function deleteRecipe(recipeId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipes/${recipeId}`,
    getFetchOptions("DELETE")
  );

  await handleResponse<void>(response);
}


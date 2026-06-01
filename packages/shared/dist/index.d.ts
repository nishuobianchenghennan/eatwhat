export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type ItemSource = 'user' | 'admin';
export type DrawMode = 'party' | 'quick';
export interface BaseItem {
    id: number;
    name: string;
    status: ItemStatus;
    source: ItemSource;
    submittedBy: string | null;
    createdAt: string;
    updatedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
}
export interface PersonItem extends BaseItem {
    name: string;
}
export interface FoodItem extends BaseItem {
    category: string | null;
    note: string | null;
}
export interface AdminUser {
    id: number;
    username: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
}
export interface SpinLog {
    id: number;
    mode: DrawMode;
    selectedPersonId: number | null;
    selectedPersonName: string | null;
    selectedFoodId: number | null;
    selectedFoodName: string | null;
    participantIds: string;
    participantNames: string;
    candidateFoodIds: string;
    candidateFoodNames: string;
    createdAt: string;
}
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}
export interface OverviewStats {
    approvedPeople: number;
    pendingPeople: number;
    approvedFoods: number;
    pendingFoods: number;
    todaySubmissions: number;
    todayDraws: number;
}
export interface PartyDrawRequest {
    personIds: number[];
    foodIds: number[];
    selectedPersonId?: number;
}
export interface PartyPersonDrawRequest {
    personIds: number[];
}
export interface PartyPersonDrawResult {
    mode: 'party';
    selectedPerson: PersonItem;
    participantPeople: PersonItem[];
    createdAt: string;
}
export interface QuickDrawRequest {
    foodIds: number[];
}
export interface DrawResult {
    mode: DrawMode;
    selectedPerson: PersonItem | null;
    selectedFood: FoodItem;
    participantPeople: PersonItem[];
    candidateFoods: FoodItem[];
    createdAt: string;
}
export declare const ITEM_STATUSES: ItemStatus[];
export declare const PERSON_STATUS_LABELS: Record<ItemStatus, string>;
export declare const FOOD_STATUS_LABELS: Record<ItemStatus, string>;
export declare const DRAW_MODE_LABELS: Record<DrawMode, string>;

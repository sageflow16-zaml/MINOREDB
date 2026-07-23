// ── Foundation Components ──
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';
export { Input } from './input';
export type { InputProps } from './input';
export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';
export { PasswordInput } from './password-input';
export type { PasswordInputProps } from './password-input';
export { SearchInput } from './search-input';
export type { SearchInputProps } from './search-input';
export { NumberInput } from './number-input';
export type { NumberInputProps } from './number-input';
export { Select, SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectValue, SelectSeparator } from './select';
export type { SelectOption } from './select';
export { Checkbox } from './checkbox';
export type { CheckboxProps } from './checkbox';
export { Switch } from './switch';
export type { SwitchProps } from './switch';
export { Label } from './label';

// ── Data Display ──
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './Card';
export { KpiCard } from './KpiCard';
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';
export { Skeleton, SkeletonCard, SkeletonTable } from './skeleton';
export { MetricCard, MetricRow, MetricGroup } from './metrics';

// ── Table System ──
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';
export { DataTable } from './DataTable';
export type { Column } from './DataTable';

// ── Feedback Components ──
export { LoadingSpinner, ErrorState, EmptyState } from './Feedback';
export { Spinner, PageLoader } from './Spinner';
export type { SpinnerProps } from './Spinner';
export { ErrorFallback } from './ErrorFallback';
export type { ErrorFallbackProps } from './ErrorFallback';
export { Alert } from './alert';
export { toast, Toaster } from './toast';

// ── Overlay Components ──
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
export { ConfirmDialog } from './ConfirmDialog';
export { RightPanel } from './RightPanel';
export { CommandPalette, useCommandPalette } from './CommandPalette';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from './dropdown-menu';
export { ScrollArea, ScrollBar } from './scroll-area';

// ── Navigation ──
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Breadcrumb } from './Breadcrumb';
export { Separator } from './separator';

// ── Layout ──
export { PageLayout, PageHeader, PageSection, PageGrid, fadeSlideUp } from './PageLayout';

// ── Form ──
export { FormField, SectionLabel } from './form-field';
export type { FormFieldProps } from './form-field';

// ── Domain Components ──
export { FeedbackBlock, TradeMemoryCard, JournalEntryCard, ResearchTaskCard, ResearchReport, ChatBubble } from './domain-cards';
export type { TradeMemoryCardProps } from './domain-cards';

// ── Charts ──
export { ChartCard, AreaChartCard, BarChartCard, PieChartCard, LineChartCard, PieChartLegend } from './chart';
export { CalendarHeatmap, CalendarHeatmapYear } from './CalendarHeatmap';
export { ScatterPlot, QuadrantChart } from './ScatterPlot';

// ── AI Components ──
export { SourceBadge } from './source-badge';
export type { SourceBadgeProps } from './source-badge';
export { ConfidenceBadge } from './confidence-badge';
export type { ConfidenceBadgeProps } from './confidence-badge';
export { TaskCard } from './task-card';
export type { TaskCardProps } from './task-card';
export { EvidencePanel } from './evidence-panel';
export type { EvidencePanelProps, EvidenceItem } from './evidence-panel';

// ── Timeline ──
export { Timeline, TimelineItem, TimelineBadge } from './timeline';

// ── Activity Feed ──
export { ActivityFeed, ActivityItem } from './activity-feed';

// ── Accordion ──
export { AccordionItem, AccordionGroup } from './accordion';

// ── Avatar ──
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

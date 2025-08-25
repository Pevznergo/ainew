# Tasks Ladder Implementation - Invite Page

## Overview
Implemented a Dropbox-style tasks ladder system on the invite page with progress tracking and gamified rewards. This is a frontend-only implementation with mock data - backend integration will be done separately.

## Task Structure & Rewards

### Individual Tasks
1. **Confirm Email** → +50 tokens ✅ (shown as completed)
2. **Fill Profile** (Nickname + Bio) → +50 tokens 🟠 (shown as 50% complete)
3. **Ask First AI Question** → +50 tokens ⭕ (pending)
4. **Publish One Chat** → +50 tokens ⭕ (pending)
5. **Share on Twitter** → +50 tokens ⭕ (pending)
6. **Share on Facebook** → +50 tokens ⭕ (pending)
7. **Write Reddit Review** → +50 tokens ⭕ (pending)
8. **Post Gets 10 Likes** → +300 tokens ⭕ (pending)

### Referral Tasks
9. **Invite Friends** (up to 16) → +50 each = **800 tokens max**
10. **Pro Subscription Friends** (up to 16) → +1,000 each = **16,000 tokens max**

### Completion Bonus
11. **Complete All Tasks** → +10,000 tokens

## Total Calculation
- Basic tasks: 8 × 50 = 400 tokens
- Engagement task: 1 × 300 = 300 tokens
- Friend invites: 16 × 50 = 800 tokens
- Pro friend bonuses: 16 × 1,000 = 16,000 tokens
- Completion bonus: 10,000 tokens
- **Total Maximum: 27,450 tokens (≈ 5,490 rubles)**

## Features Implemented

### Progress Bar
- Shows current progress with visual bar
- Displays tokens earned vs. maximum possible
- Percentage completion indicator
- Mock data: 850/27,450 tokens (3.1% complete)

### Task Status Indicators
- **Completed**: Green border, checkmark icon
- **In Progress**: Orange border, percentage indicator
- **Pending**: Gray border, neutral state

### Visual Design Elements
- Gradient progress bar (indigo to cyan)
- Color-coded task cards based on status
- Social media icons for sharing tasks
- Achievement-style completion bonus section
- Responsive grid layout (1/2/3 columns)

### Mock Data Status
Currently showing:
- ✅ Email confirmed (completed)
- 🟠 Profile 50% filled (in progress)
- ⭕ All other tasks pending

## UI Components

### Task Card Structure
```jsx
<div className="rounded-2xl border border-{color} bg-{color}/5 p-6">
  <StatusIndicator />
  <TaskTitle />
  <TaskDescription />
  <TokenReward />
</div>
```

### Progress Bar Component
- Total width represents 27,450 tokens
- Current fill shows proportion completed
- Smooth animations for future updates
- Clear labeling with tokens and percentage

### Completion Bonus Section
- Prominent placement at bottom
- Special gradient styling
- Large token reward display
- Motivational messaging

## Integration Points for Backend

### Data Structure Needed
```typescript
interface UserTasks {
  emailConfirmed: boolean;
  profileFilled: {
    nickname: boolean;
    bio: boolean;
  };
  firstAiQuestion: boolean;
  publishedChat: boolean;
  socialShares: {
    twitter: boolean;
    facebook: boolean;
    reddit: boolean;
  };
  friendsInvited: number; // 0-16
  proFriendsCount: number; // 0-16
  postLikes: number;
  allTasksCompleted: boolean;
  totalTokensEarned: number;
}
```

### API Endpoints Needed
- `GET /api/tasks/status` - Get current task completion status
- `POST /api/tasks/complete/{taskId}` - Mark task as completed
- `GET /api/tasks/progress` - Get detailed progress info

### Dynamic Updates Required
- Real-time progress bar updates
- Task status changes (pending → in progress → completed)
- Token balance updates
- Achievement notifications

## Styling & Responsive Design

### Color Scheme
- **Completed**: Green (#10B981)
- **In Progress**: Orange (#F59E0B)
- **Pending**: Neutral Gray (#6B7280)
- **Special Tasks**: Purple (#8B5CF6), Yellow (#EAB308)
- **Progress Bar**: Indigo to Cyan gradient

### Responsive Breakpoints
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- All elements stack properly on smaller screens

### Accessibility
- Clear visual hierarchy
- Sufficient color contrast
- Descriptive text for all tasks
- Icon + text combinations for clarity

## Next Steps for Backend Integration

1. **Replace Mock Data**: Connect progress bar to real user data
2. **Task Validation**: Implement server-side task completion validation
3. **Real-time Updates**: WebSocket or polling for live progress updates
4. **Token Management**: Connect to actual token balance system
5. **Achievement System**: Implement completion notifications and rewards
6. **Analytics**: Track task completion rates and user engagement

## User Experience Goals

- **Gamification**: Make earning tokens fun and engaging
- **Clear Progress**: Users always know what to do next
- **Motivation**: Large completion bonus encourages full participation
- **Social Sharing**: Built-in viral growth through social tasks
- **Transparency**: Clear token values for all actions

The tasks ladder creates a comprehensive onboarding and engagement system that guides users through key platform features while rewarding them with meaningful token incentives.
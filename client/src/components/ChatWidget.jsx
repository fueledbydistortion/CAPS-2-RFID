import React, { useState, useEffect, useRef } from "react";
import {
	Alert,
	AppBar,
	Avatar,
	Badge,
	Box,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Fab,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	Menu,
	MenuItem,
	Paper,
	Slide,
	TextField,
	Toolbar,
	Typography,
} from "@mui/material";
import {
	Chat as ChatIcon,
	Send as SendIcon,
	Close as CloseIcon,
	ArrowBack as ArrowBackIcon,
	MoreVert as MoreVertIcon,
	Search as SearchIcon,
	Person as PersonIcon,
	Add as AddIcon,
	Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import {
	listenToMessages,
	sendMessageDirect,
	markMessagesAsReadDirect,
	deleteConversationDirect,
} from "../utils/chatUtils";
import { formatDistanceToNow } from "date-fns";
import StartChatButton from "./StartChatButton";

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

const ChatWidget = () => {
	const { currentUser, userProfile } = useAuth();
	const {
		isWidgetOpen,
		closeWidget,
		conversations,
		unreadCount,
		activeConversation,
		closeConversation,
		toggleWidget,
		loading: conversationsLoading,
	} = useChat();

	const [view, setView] = useState("list"); // 'list' or 'chat'
	const [selectedConversation, setSelectedConversation] = useState(null);
	const [messages, setMessages] = useState([]);
	const [messageText, setMessageText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [anchorEl, setAnchorEl] = useState(null);
	const [sending, setSending] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const messagesEndRef = useRef(null);

	// Log conversations for debugging
	useEffect(() => {
		console.log("Current conversations:", conversations);
		console.log("Conversations loading:", conversationsLoading);
	}, [conversations, conversationsLoading]);

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Listen to messages when a conversation is selected
	useEffect(() => {
		if (!selectedConversation) {
			setMessages([]);
			return;
		}

		console.log(
			"Listening to messages for conversation:",
			selectedConversation.conversationId
		);
		const unsubscribe = listenToMessages(
			selectedConversation.conversationId,
			(msgs) => {
				console.log("Messages updated:", msgs.length);
				setMessages(msgs);

				// Mark messages as read when new messages arrive
				if (currentUser && msgs.length > 0) {
					const unreadMessages = msgs.filter(
						(msg) => msg.senderId !== currentUser.uid && !msg.read
					);
					if (unreadMessages.length > 0) {
						console.log("Marking", unreadMessages.length, "messages as read");
						markMessagesAsReadDirect(
							selectedConversation.conversationId,
							currentUser.uid
						);
					}
				}
			}
		);

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, [selectedConversation, currentUser]);

	// Handle active conversation from context
	useEffect(() => {
		if (activeConversation) {
			console.log("Active conversation set:", activeConversation);
			setSelectedConversation(activeConversation);
			setView("chat");

			// Mark messages as read when conversation is opened from context
			if (currentUser && activeConversation.conversationId) {
				markMessagesAsReadDirect(
					activeConversation.conversationId,
					currentUser.uid
				);
			}
		}
	}, [activeConversation, currentUser]);

	const handleOpenConversation = async (conversation) => {
		console.log("Opening conversation:", conversation.conversationId);
		setSelectedConversation(conversation);
		setView("chat");

		// Mark messages as read immediately when conversation is clicked
		if (currentUser && conversation.conversationId) {
			console.log(
				"Marking messages as read for conversation:",
				conversation.conversationId
			);
			await markMessagesAsReadDirect(
				conversation.conversationId,
				currentUser.uid
			);
		}
	};

	const handleBackToList = () => {
		setView("list");
		setSelectedConversation(null);
		closeConversation();
	};

	const handleRefreshConversations = async () => {
		setRefreshing(true);
		// The conversations are already being listened to in real-time via ChatContext
		// This is just for visual feedback
		setTimeout(() => {
			setRefreshing(false);
			console.log("Conversations refreshed:", conversations);
		}, 500);
	};

	const handleSendMessage = async () => {
		if (!messageText.trim() || !selectedConversation || !currentUser || sending)
			return;

		setSending(true);
		const result = await sendMessageDirect(
			selectedConversation.conversationId,
			currentUser.uid,
			userProfile?.name || currentUser.email,
			messageText.trim()
		);

		if (result.success) {
			setMessageText("");
		}
		setSending(false);
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleDeleteConversation = async () => {
		if (selectedConversation && currentUser) {
			const result = await deleteConversationDirect(
				selectedConversation.conversationId,
				currentUser.uid
			);

			if (result.success) {
				handleBackToList();
			}
		}
		handleMenuClose();
	};

	const filteredConversations = conversations.filter((conv) => {
		if (!searchQuery) return true;

		const otherParticipant = Object.entries(conv.participants).find(
			([id]) => id !== currentUser?.uid
		);

		return otherParticipant?.[1]?.name
			?.toLowerCase()
			.includes(searchQuery.toLowerCase());
	});

	const getOtherParticipant = (conversation) => {
		if (!conversation?.participants) return null;
		const otherParticipant = Object.entries(conversation.participants).find(
			([id]) => id !== currentUser?.uid
		);
		return otherParticipant?.[1];
	};

	const formatMessageTime = (timestamp) => {
		if (!timestamp) return "";
		try {
			return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
		} catch {
			return "";
		}
	};

	if (!currentUser) return null;

	return (
		<>
			{/* Floating Chat Button */}
			<Fab
				color="primary"
				aria-label="chat"
				sx={{
					position: "fixed",
					bottom: 20,
					right: 20,
					zIndex: 1000,
				}}
				onClick={toggleWidget}
			>
				<Badge badgeContent={unreadCount} color="error">
					<ChatIcon />
				</Badge>
			</Fab>

			{/* Chat Widget Dialog */}
			<Dialog
				fullScreen
				open={isWidgetOpen}
				onClose={closeWidget}
				TransitionComponent={Transition}
				sx={{
					"& .MuiDialog-paper": {
						maxWidth: { xs: "100%", sm: 500 },
						maxHeight: { xs: "100%", sm: 700 },
						height: "100%",
						margin: { xs: 0, sm: 2 },
						position: "fixed",
						right: { xs: 0, sm: 20 },
						bottom: { xs: 0, sm: 20 },
						top: { xs: 0, sm: "auto" },
						borderRadius: { xs: 0, sm: "16px" },
						overflow: "hidden",
					},
				}}
			>
				{/* App Bar */}
				<AppBar
					sx={{
						position: "relative",
						borderRadius: { xs: 0, sm: "16px 16px 0 0" },
						"& .MuiToolbar-root": {
							color: "white",
						},
					}}
				>
					<Toolbar>
						{view === "chat" && (
							<IconButton
								edge="start"
								color="inherit"
								onClick={handleBackToList}
								aria-label="back"
							>
								<ArrowBackIcon />
							</IconButton>
						)}
						<Typography
							sx={{ ml: 2, flex: 1, color: "white" }}
							variant="h6"
							component="div"
						>
							{view === "chat" && selectedConversation
								? getOtherParticipant(selectedConversation)?.name
								: `Messages ${
										conversations.length > 0 ? `(${conversations.length})` : ""
								  }`}
						</Typography>
						{view === "list" && (
							<>
								<IconButton
									color="inherit"
									onClick={handleRefreshConversations}
									disabled={refreshing}
									size="small"
									sx={{ mr: 1 }}
								>
									<RefreshIcon className={refreshing ? "spinning" : ""} />
								</IconButton>
								<StartChatButton
									buttonText="New Chat"
									variant="contained"
									size="small"
									sx={{
										mr: 1,
										bgcolor: "rgba(255, 255, 255, 0.2)",
										color: "white",
										"&:hover": {
											bgcolor: "rgba(255, 255, 255, 0.3)",
										},
										"& .MuiButton-startIcon": {
											color: "white",
										},
									}}
								/>
							</>
						)}
						{view === "chat" && (
							<IconButton color="inherit" onClick={handleMenuOpen}>
								<MoreVertIcon />
							</IconButton>
						)}
						<IconButton
							edge="end"
							color="inherit"
							onClick={closeWidget}
							aria-label="close"
						>
							<CloseIcon />
						</IconButton>
					</Toolbar>
				</AppBar>

				{/* Conversation Menu */}
				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
				>
					<MenuItem onClick={handleDeleteConversation}>
						Delete Conversation
					</MenuItem>
				</Menu>

				{/* Content */}
				<DialogContent
					sx={{
						p: 0,
						display: "flex",
						flexDirection: "column",
						height: "100%",
					}}
				>
					{view === "list" ? (
						// Conversations List
						<Box
							sx={{ height: "100%", display: "flex", flexDirection: "column" }}
						>
							{/* Search */}
							<Box sx={{ p: 2 }}>
								<TextField
									fullWidth
									size="small"
									placeholder="Search conversations..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon />
											</InputAdornment>
										),
									}}
								/>
							</Box>

							<Divider />

							{/* Loading State */}
							{conversationsLoading && conversations.length === 0 ? (
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										p: 4,
									}}
								>
									<Box sx={{ textAlign: "center" }}>
										<CircularProgress sx={{ mb: 2 }} />
										<Typography variant="body2" color="text.secondary">
											Loading conversations...
										</Typography>
									</Box>
								</Box>
							) : (
								<>
									{/* Conversation Count */}
									{!searchQuery && conversations.length > 0 && (
										<Box sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
											<Typography variant="caption" color="text.secondary">
												{conversations.length} conversation
												{conversations.length !== 1 ? "s" : ""}
												{unreadCount > 0 && ` • ${unreadCount} unread`}
											</Typography>
										</Box>
									)}

									{/* Conversations */}
									<List sx={{ flexGrow: 1, overflow: "auto" }}>
										{filteredConversations.length === 0 ? (
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													justifyContent: "center",
													height: "100%",
													p: 3,
												}}
											>
												<ChatIcon
													sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
												/>
												<Typography
													color="text.secondary"
													align="center"
													gutterBottom
												>
													{searchQuery
														? "No conversations found"
														: "No conversations yet"}
												</Typography>
												{!searchQuery && (
													<Box sx={{ mt: 2 }}>
														<StartChatButton
															buttonText="Start a Conversation"
															variant="contained"
															size="medium"
														/>
													</Box>
												)}
											</Box>
										) : (
											filteredConversations.map((conversation) => {
												const otherParticipant =
													getOtherParticipant(conversation);
												const lastMsg = conversation.lastMessage;

												return (
													<React.Fragment key={conversation.conversationId}>
														<ListItemButton
															onClick={() =>
																handleOpenConversation(conversation)
															}
															sx={{
																"&:hover": {
																	bgcolor: "action.hover",
																},
															}}
														>
															<ListItemAvatar>
																<Avatar
																	sx={{
																		bgcolor:
																			otherParticipant?.role === "teacher"
																				? "primary.main"
																				: "secondary.main",
																	}}
																>
																	<PersonIcon />
																</Avatar>
															</ListItemAvatar>
															<ListItemText
																primary={
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 1,
																			justifyContent: "space-between",
																		}}
																	>
																		<Box
																			sx={{
																				display: "flex",
																				alignItems: "center",
																				gap: 1,
																			}}
																		>
																			<Typography
																				variant="subtitle2"
																				sx={{
																					fontWeight:
																						conversation.unreadCount > 0
																							? 700
																							: 400,
																				}}
																			>
																				{otherParticipant?.name ||
																					"Unknown User"}
																			</Typography>
																			<Chip
																				label={otherParticipant?.role || "User"}
																				size="small"
																				color={
																					otherParticipant?.role === "teacher"
																						? "primary"
																						: "secondary"
																				}
																				sx={{ height: 18, fontSize: "0.65rem" }}
																			/>
																		</Box>
																		{conversation.unreadCount > 0 && (
																			<Chip
																				label={conversation.unreadCount}
																				color="error"
																				size="small"
																				sx={{
																					height: 20,
																					minWidth: 20,
																					"& .MuiChip-label": { px: 0.75 },
																				}}
																			/>
																		)}
																	</Box>
																}
																secondary={
																	<Box>
																		<Typography
																			variant="body2"
																			color="text.secondary"
																			sx={{
																				overflow: "hidden",
																				textOverflow: "ellipsis",
																				whiteSpace: "nowrap",
																				fontWeight:
																					conversation.unreadCount > 0
																						? 600
																						: 400,
																			}}
																		>
																			{lastMsg?.message || "No messages yet"}
																		</Typography>
																		<Typography
																			variant="caption"
																			color="text.secondary"
																		>
																			{lastMsg
																				? formatMessageTime(lastMsg.timestamp)
																				: ""}
																		</Typography>
																	</Box>
																}
															/>
														</ListItemButton>
														<Divider />
													</React.Fragment>
												);
											})
										)}
									</List>
								</>
							)}
						</Box>
					) : (
						// Chat View
						<Box
							sx={{ height: "100%", display: "flex", flexDirection: "column" }}
						>
							{/* Messages */}
							<Box
								sx={{
									flexGrow: 1,
									overflow: "auto",
									p: 2,
									display: "flex",
									flexDirection: "column",
									gap: 1,
								}}
							>
								{messages.length === 0 ? (
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											height: "100%",
										}}
									>
										<ChatIcon
											sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
										/>
										<Typography color="text.secondary" align="center">
											No messages yet. Start the conversation!
										</Typography>
									</Box>
								) : (
									messages.map((msg) => {
										const isOwn = msg.senderId === currentUser.uid;
										return (
											<Box
												key={msg.messageId}
												sx={{
													display: "flex",
													justifyContent: isOwn ? "flex-end" : "flex-start",
												}}
											>
												<Paper
													sx={{
														p: 1.5,
														maxWidth: "70%",
														backgroundColor: isOwn
															? "primary.main"
															: "grey.200",
														color: isOwn ? "white" : "text.primary",
														borderRadius: "12px",
													}}
												>
													{!isOwn && (
														<Typography
															variant="caption"
															sx={{
																fontWeight: "bold",
																display: "block",
																mb: 0.5,
																color: "inherit",
															}}
														>
															{msg.senderName}
														</Typography>
													)}
													<Typography
														variant="body2"
														sx={{ wordBreak: "break-word", color: "inherit" }}
													>
														{msg.message}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															display: "block",
															mt: 0.5,
															opacity: 0.7,
															fontSize: "0.65rem",
															color: "inherit",
														}}
													>
														{formatMessageTime(msg.timestamp)}
													</Typography>
												</Paper>
											</Box>
										);
									})
								)}
								<div ref={messagesEndRef} />
							</Box>

							{/* Message Input */}
							<Divider />
							<Box sx={{ p: 2, backgroundColor: "background.paper" }}>
								<Alert
									severity="warning"
									variant="outlined"
									icon={false}
									sx={{
										mb: 1,
										py: 0.5,
										px: 1.5,
										fontSize: "0.75rem",
										color: "warning.dark",
										borderColor: "warning.light",
										"& .MuiAlert-message": {
											width: "100%",
											padding: 0,
										},
									}}
								>
									Attachments and images aren't supported in chat messages.
								</Alert>
								<TextField
									fullWidth
									size="small"
									placeholder="Type a message..."
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									onKeyPress={handleKeyPress}
									disabled={sending}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													color="primary"
													onClick={handleSendMessage}
													disabled={!messageText.trim() || sending}
												>
													{sending ? (
														<CircularProgress size={24} />
													) : (
														<SendIcon />
													)}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Box>
						</Box>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ChatWidget;

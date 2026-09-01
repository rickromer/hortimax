ALTER TABLE `checkins` ADD `clientRequestId` varchar(64);--> statement-breakpoint
ALTER TABLE `followups` ADD `clientRequestId` varchar(64);--> statement-breakpoint
ALTER TABLE `notes` ADD `clientRequestId` varchar(64);--> statement-breakpoint
ALTER TABLE `sites` ADD `clientRequestId` varchar(64);
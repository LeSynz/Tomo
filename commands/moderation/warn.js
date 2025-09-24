const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');
const ConfigModel = require('../../models/ConfigModel');
const { processBanEmbedTemplate } = require('../../utils/templateProcessor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'warn');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (targetUser.id === interaction.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Self-Reflection!')
          .setDescription('You cannot warn yourself, silly! Try some self-reflection instead~ 💕')
          .setFooter({ text: 'Be kind to yourself! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 I\'m Perfect!')
          .setDescription('I don\'t need warnings! I\'m a good bot~ 💖')
          .setFooter({ text: 'Always learning and improving! ✨' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (targetMember) {
        if (targetMember.id === interaction.guild.ownerId) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('👑 Owner Immunity!')
            .setDescription('Cannot warn the server owner! They make the rules~ ✨')
            .setFooter({ text: 'Ultimate authority! 💫' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }

        const moderatorMember = interaction.member;
        if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position && 
            interaction.user.id !== interaction.guild.ownerId) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('👑 Role Hierarchy')
            .setDescription('You cannot warn someone with equal or higher roles than you!')
            .setFooter({ text: 'Respect the hierarchy! ✊' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }
      }

      await interaction.deferReply({ ephemeral: true });

      const dbAction = await ModerationActionModel.logAction({
        type: 'warn',
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason
      });

      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('⚠️ Warning Received')
        .setDescription(`You have received a warning in **${interaction.guild.name}**`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          }
        )
        .setFooter({ 
          text: 'Please follow the server rules to avoid further action',
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user ${targetUser.tag} about their warning:`, dmError.message);
      }

      await moderationLogger.logAction(interaction.client, {
        type: 'warn',
        moderator: interaction.user,
        target: targetUser,
        reason: reason,
        caseId: dbAction.caseId
      });

      const config = await ConfigModel.getConfig();
      if (config.automodEnabled) {
        const userWarnings = await ModerationActionModel.getUserWarnings(targetUser.id, interaction.guild.id);
        const warningCount = userWarnings.length;
        
        const automodAction = await ConfigModel.getAutomodActionForWarnings(warningCount);
        if (automodAction) {
          try {
            let automodDbAction = null;
            
            if (automodAction.action === 'mute' && targetMember) {
              const muteRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase().includes('mute'));
              if (muteRole) {
                await targetMember.roles.add(muteRole);
                if (automodAction.duration) {
                  setTimeout(async () => {
                    try {
                      await targetMember.roles.remove(muteRole);
                    } catch (e) {}
                  }, automodAction.duration);
                }
                
                automodDbAction = await ModerationActionModel.logAction({
                  type: 'mute',
                  userId: targetUser.id,
                  moderatorId: interaction.client.user.id,
                  reason: `Automod: ${warningCount} warnings reached`,
                  duration: automodAction.duration
                });

                const muteDmEmbed = new EmbedBuilder()
                  .setColor(0xFFB6C1)
                  .setTitle('🔇 You have been muted')
                  .setDescription(`You have been automatically muted in **${interaction.guild.name}** due to reaching ${warningCount} warnings.`)
                  .addFields(
                    {
                      name: '💭 Reason',
                      value: `\`Automod: ${warningCount} warnings reached\``,
                      inline: false
                    },
                    {
                      name: '📋 Case ID',
                      value: `\`${automodDbAction.caseId}\``,
                      inline: true
                    },
                    {
                      name: '⏰ Duration',
                      value: automodAction.duration ? `${automodAction.duration / 60000} minutes` : 'Indefinite',
                      inline: true
                    }
                  )
                  .setFooter({ 
                    text: 'Please follow the server rules to avoid further action',
                    iconURL: interaction.guild.iconURL() 
                  })
                  .setTimestamp();

                try {
                  await targetUser.send({ embeds: [muteDmEmbed] });
                } catch (dmError) {
                  console.log(`Could not DM user ${targetUser.tag} about their mute:`, dmError.message);
                }
              }
            } else if (automodAction.action === 'kick' && targetMember) {
              automodDbAction = await ModerationActionModel.logAction({
                type: 'kick',
                userId: targetUser.id,
                moderatorId: interaction.client.user.id,
                reason: `Automod: ${warningCount} warnings reached`
              });

              const kickDmEmbed = new EmbedBuilder()
                .setColor(0xFFB6C1)
                .setTitle('👢 You have been kicked')
                .setDescription(`You have been automatically kicked from **${interaction.guild.name}** due to reaching ${warningCount} warnings.`)
                .addFields(
                  {
                    name: '💭 Reason',
                    value: `\`Automod: ${warningCount} warnings reached\``,
                    inline: false
                  },
                  {
                    name: '📋 Case ID',
                    value: `\`${automodDbAction.caseId}\``,
                    inline: true
                  }
                )
                .setFooter({ 
                  text: 'You can rejoin the server if you have an invite',
                  iconURL: interaction.guild.iconURL() 
                })
                .setTimestamp();

              try {
                await targetUser.send({ embeds: [kickDmEmbed] });
              } catch (dmError) {
                console.log(`Could not DM user ${targetUser.tag} about their kick:`, dmError.message);
              }

              await targetMember.kick(`Automod: ${warningCount} warnings reached`);
            } else if (automodAction.action === 'ban' && targetMember) {
              automodDbAction = await ModerationActionModel.logAction({
                type: 'ban',
                userId: targetUser.id,
                moderatorId: interaction.client.user.id,
                reason: `Automod: ${warningCount} warnings reached`
              });

              const appealInvite = await configModel.getAppealInvite();
              const appealsEnabled = await configModel.isAppealsEnabled();
              const banTemplate = await configModel.getBanEmbedTemplate();
              
              const processedTemplate = processBanEmbedTemplate(banTemplate, {
                user: targetUser,
                server: interaction.guild,
                reason: `Automod: ${warningCount} warnings reached`,
                caseId: automodDbAction.caseId,
                appealInvite: appealInvite,
                moderator: interaction.client.user
              });
              
              const banDmEmbed = new EmbedBuilder()
                .setColor(processedTemplate.color)
                .setTitle(processedTemplate.title)
                .setDescription(processedTemplate.description)
                .addFields(
                  {
                    name: '💭 Reason',
                    value: `\`Automod: ${warningCount} warnings reached\``,
                    inline: false
                  },
                  {
                    name: '📋 Case ID',
                    value: `\`${automodDbAction.caseId}\``,
                    inline: true
                  }
                )
                .setFooter({ 
                  text: processedTemplate.footer,
                  iconURL: interaction.guild.iconURL() 
                })
                .setTimestamp();

              let dmComponents = [];
              if (appealsEnabled && appealInvite) {
                banDmEmbed.addFields({
                  name: '⚖️ Appeal This Ban',
                  value: `If you believe this ban was unfair, you can join our appeal server to submit an appeal.\n\n**📋 Your Case ID:** \`${automodDbAction.caseId}\`\n**🆔 Your User ID:** \`${targetUser.id}\`\n\nMake sure to provide these details when appealing.`,
                  inline: false
                });

                const appealButton = new ButtonBuilder()
                  .setLabel('⚖️ Join Appeal Server')
                  .setStyle(ButtonStyle.Link)
                  .setURL(appealInvite);

                dmComponents.push(new ActionRowBuilder().addComponents(appealButton));
              }

              try {
                const dmOptions = { embeds: [banDmEmbed] };
                if (dmComponents.length > 0) {
                  dmOptions.components = dmComponents;
                }
                await targetUser.send(dmOptions);
              } catch (dmError) {
                console.log(`Could not DM user ${targetUser.tag} about their ban:`, dmError.message);
              }

              await targetMember.ban({ reason: `Automod: ${warningCount} warnings reached` });
            }

            if (automodDbAction) {
              await moderationLogger.logAction(interaction.client, {
                type: automodAction.action,
                moderator: interaction.client.user,
                target: targetUser,
                reason: `Automod: ${warningCount} warnings reached`,
                duration: automodAction.duration,
                caseId: automodDbAction.caseId
              });
            }
          } catch (automodError) {
            console.error('Automod action failed:', automodError);
          }
        }
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('⚠️ Warning Issued')
        .setDescription(`Successfully warned **${targetUser.tag}**!`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: 'Warning recorded! 📝' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in warn command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Warning Failed')
        .setDescription('An error occurred while trying to warn the user! Please try again~')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
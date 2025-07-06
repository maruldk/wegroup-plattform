
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, X } from 'lucide-react'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
  joinPolicy: z.enum(['OPEN', 'REQUEST', 'INVITE_ONLY']),
  category: z.string().optional(),
  maxMembers: z.number().positive().optional(),
  tags: z.array(z.string()).optional()
})

type CreateGroupData = z.infer<typeof createGroupSchema>

interface GroupCreateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GroupCreateForm({ open, onOpenChange, onSuccess }: GroupCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const { toast } = useToast()

  const form = useForm<CreateGroupData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN',
      tags: []
    }
  })

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setValue('tags', newTags)
  }

  const onSubmit = async (data: CreateGroupData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Gruppe erstellt',
          description: 'Die Gruppe wurde erfolgreich erstellt.',
        })
        form.reset()
        setTags([])
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Fehler beim Erstellen der Gruppe',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neue Gruppe erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Gruppe und laden Sie Mitglieder ein.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Gruppenname *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="z.B. Frontend Entwickler"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <textarea
                id="description"
                {...form.register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Beschreiben Sie den Zweck und die Ziele der Gruppe..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visibility">Sichtbarkeit</Label>
                <select
                  id="visibility"
                  {...form.register('visibility')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="PUBLIC">Öffentlich</option>
                  <option value="UNLISTED">Ungelistet</option>
                  <option value="PRIVATE">Privat</option>
                </select>
              </div>

              <div>
                <Label htmlFor="joinPolicy">Beitrittsrichtlinie</Label>
                <select
                  id="joinPolicy"
                  {...form.register('joinPolicy')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="OPEN">Offen</option>
                  <option value="REQUEST">Auf Anfrage</option>
                  <option value="INVITE_ONLY">Nur auf Einladung</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Input
                  id="category"
                  {...form.register('category')}
                  placeholder="z.B. Technologie"
                />
              </div>

              <div>
                <Label htmlFor="maxMembers">Max. Mitglieder</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  {...form.register('maxMembers', { valueAsNumber: true })}
                  placeholder="Unbegrenzt"
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Tag hinzufügen..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bis zu 10 Tags möglich
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Erstelle...' : 'Gruppe erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

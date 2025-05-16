
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { addClientToFirestore } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const behaviouralBriefSchema = z.object({
  // CONTACT INFORMATION
  ownerFirstName: z.string().min(1, { message: "First Name is required." }),
  ownerLastName: z.string().min(1, { message: "Last Name is required." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  contactNumber: z.string().min(5, { message: "Contact Number is required." }), // Basic length validation
  postcode: z.string().min(3, { message: "Postcode is required." }), // Basic length validation

  // DOG INFORMATION
  dogName: z.string().min(1, { message: "Dog Name is required." }),
  dogSex: z.enum(['Male', 'Female'], { required_error: "Sex is required." }),
  dogBreed: z.string().min(1, { message: "Dog breed is required." }),
  lifeWithDogAndHelpNeeded: z.string().min(10, { message: "This field is required (min 10 characters)." }),
  bestOutcome: z.string().min(10, { message: "This field is required (min 10 characters)." }),
  idealSessionTypes: z.array(z.string()).optional(), // Checkbox group, optional based on HTML structure

  // System field
  submissionDate: z.string(), // Will be auto-filled
});

type BehaviouralBriefFormValues = z.infer<typeof behaviouralBriefSchema>;

const sessionTypeOptions = [
  { id: "online", label: "Online Session" },
  { id: "in-person", label: "In-Person Session" },
  { id: "rescue-remedy", label: "Rescue Remedy Session (Dog Club members & current clients only)" },
];


export default function BehaviouralBriefPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentSubmissionDate, setCurrentSubmissionDate] = useState(format(new Date(), "yyyy-MM-dd HH:mm:ss"));
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BehaviouralBriefFormValues>({
    resolver: zodResolver(behaviouralBriefSchema),
    defaultValues: {
      submissionDate: currentSubmissionDate,
      ownerFirstName: '',
      ownerLastName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
      dogName: '',
      dogSex: undefined, // Important for controlled Select
      dogBreed: '',
      lifeWithDogAndHelpNeeded: '',
      bestOutcome: '',
      idealSessionTypes: [],
    }
  });

  const handleFormSubmit: SubmitHandler<BehaviouralBriefFormValues> = async (data) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({
        title: "Service Unavailable",
        description: "The form submission service is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...data,
        submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      };

      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = submissionData;
      
      await addClientToFirestore(clientDataForFirestore);
      toast({
        title: "Submission Successful!",
        description: "Thank you for submitting your Behavioural Brief. We will be in touch shortly.",
      });
      const newDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      setCurrentSubmissionDate(newDate);
      reset({
        submissionDate: newDate, 
        ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '',
        dogName: '', dogSex: undefined, dogBreed: '', lifeWithDogAndHelpNeeded: '', bestOutcome: '',
        idealSessionTypes: [],
      });
    } catch (err) {
      console.error("Error submitting behavioural brief to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: "Submission Error",
        description: `There was a problem submitting your form: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionTitle: React.FC<{ title: string, description?: string }> = ({ title, description }) => (
    <>
      <Separator className="my-6" />
      <h2 className="text-xl font-semibold mb-2 text-primary">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
    </>
  );
  
  const FormField: React.FC<{ label: string; htmlForProp: keyof BehaviouralBriefFormValues, error?: string, children: React.ReactNode, required?: boolean, description?: string }> = ({ label, htmlForProp, error, children, required, description }) => (
    <div className="space-y-2 mb-4">
      <Label htmlFor={htmlForProp}>{label}{required && <span className="text-destructive">*</span>}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-muted/20">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold">Behavioural Brief</CardTitle>
          <CardDescription>
            Please fill out this questionnaire. Fields marked with <span className="text-destructive">*</span> are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            <SectionTitle title="CONTACT INFORMATION" />
            <FormField label="Owner Name" htmlForProp="ownerFirstName" error={errors.ownerFirstName?.message || errors.ownerLastName?.message} required>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerFirstName" className="text-xs text-muted-foreground">First Name</Label>
                  <Input id="ownerFirstName" {...register("ownerFirstName")} className={errors.ownerFirstName ? "border-destructive" : ""} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="ownerLastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <Input id="ownerLastName" {...register("ownerLastName")} className={errors.ownerLastName ? "border-destructive" : ""} disabled={isSubmitting} />
                </div>
              </div>
            </FormField>
            <FormField label="Email" htmlForProp="contactEmail" error={errors.contactEmail?.message} required>
              <Input id="contactEmail" type="email" {...register("contactEmail")} className={errors.contactEmail ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Contact Number" htmlForProp="contactNumber" error={errors.contactNumber?.message} required>
              <Input id="contactNumber" type="tel" {...register("contactNumber")} className={errors.contactNumber ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Postcode" htmlForProp="postcode" error={errors.postcode?.message} required>
              <Input id="postcode" {...register("postcode")} className={errors.postcode ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>

            <SectionTitle title="DOG INFORMATION" description="If you are inquiring about more than one dog please complete an additional form." />
            <FormField label="Dog Name" htmlForProp="dogName" error={errors.dogName?.message} required>
              <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Sex" htmlForProp="dogSex" error={errors.dogSex?.message} required>
              <Controller
                name="dogSex"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <SelectTrigger className={errors.dogSex ? "border-destructive" : ""}>
                      <SelectValue placeholder="Please Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="What breed is your dog?" htmlForProp="dogBreed" error={errors.dogBreed?.message} required description="Unknown/mixed is fine :-)">
              <Input id="dogBreed" {...register("dogBreed")} className={errors.dogBreed ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="In general, how is life with your dog, and what would you like help with?" htmlForProp="lifeWithDogAndHelpNeeded" error={errors.lifeWithDogAndHelpNeeded?.message} required description="New puppy, new dog, new rescue, general training, behaviour concern, etc.">
              <Textarea id="lifeWithDogAndHelpNeeded" {...register("lifeWithDogAndHelpNeeded")} className={errors.lifeWithDogAndHelpNeeded ? "border-destructive" : ""} disabled={isSubmitting} rows={4} />
            </FormField>
            <FormField label="What would be the best outcome for you and your dog?" htmlForProp="bestOutcome" error={errors.bestOutcome?.message} required description="E.g. a better relationship, a happier dog, an easier home life, more relaxed walks, etc.">
              <Textarea id="bestOutcome" {...register("bestOutcome")} className={errors.bestOutcome ? "border-destructive" : ""} disabled={isSubmitting} rows={4} />
            </FormField>

            <FormField label="Which type of session would you ideally like?" htmlForProp="idealSessionTypes" error={errors.idealSessionTypes?.message}>
              <Controller
                name="idealSessionTypes"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {sessionTypeOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sessionType-${option.id}`}
                          checked={field.value?.includes(option.label)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), option.label])
                              : field.onChange(
                                  (field.value || []).filter(
                                    (value) => value !== option.label
                                  )
                                );
                          }}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`sessionType-${option.id}`} className="font-normal">{option.label}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </FormField>
            
            <input type="hidden" {...register("submissionDate")} value={currentSubmissionDate} />
             <div className="text-sm text-muted-foreground">
                Date of Submission: {format(new Date(currentSubmissionDate), 'PPP p')}
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Questionnaire
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-md">
        Thank you, I have received your form! If you haven't heard back from me within the next couple of days, please check the spam folder in your emails.
      </p>
    </div>
  );
}
